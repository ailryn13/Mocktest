import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTestStore } from '../store/testStore';
import { testAPI } from '../services/testAPI';
import { useAIProctoring } from '../hooks/useAIProctoring';
import { useExtensionDetection } from '../hooks/useExtensionDetection';
import { useKeystrokeAnalysis } from '../hooks/useKeystrokeAnalysis';
import { useIPTracking } from '../hooks/useIPTracking';
import { useViolationDetection } from '../hooks/useViolationDetection';
import { useScreenCaptureDetection } from '../hooks/useScreenCaptureDetection';
import { useGlobalErrorHandler } from '../hooks/useGlobalErrorHandler';
import ProctoringNotice from '../components/ProctoringNotice';
import WebcamPreview from '../components/WebcamPreview';
import AntiPhotoWatermark from '../components/AntiPhotoWatermark';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    ClipboardList,
    Clock,
    ShieldAlert,
    Rocket,
    AlertTriangle
} from 'lucide-react';

export default function TestTakingPage() {
    const { testId } = useParams();
    const navigate = useNavigate();

    // Add global error handler
    useGlobalErrorHandler();
    const { startTest, getAttempt, submitAnswer, executeCode, submitTest, violations } = useTestStore();

    const [test, setTest] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});

    const [codeAnswers, setCodeAnswers] = useState({});
    const [selectedLanguages, setSelectedLanguages] = useState({}); // Map<qId, langId>
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [loading, setLoading] = useState(true);
    const [testStarted, setTestStarted] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [executionResults, setExecutionResults] = useState({});
    const [isExecuting, setIsExecuting] = useState(false);
    const [isFrozen, setIsFrozen] = useState(false);

    const autoSaveInterval = useRef(null);

    // AI Proctoring
    const { videoRef, modelsLoaded, faceCount, detectedObjects, aiViolationCount, cameraStatus, headRotation } = useAIProctoring(
        attempt?.id,
        !loading && attempt !== null,
        () => {
            // Immediate Freeze Callback
            console.log('CRITICAL: Phone/Camera detected - Freezing immediately');
            setIsFrozen(true);
            setTimeout(() => {
                window.location.href = '/exam-terminated';
            }, 2000);
        },
        (error) => {
            // Camera Failed Callback - Block test
            console.error('CRITICAL: Camera access denied - Blocking test', error);
            toast.error('Camera access is mandatory for this test. Redirecting to dashboard...');
            setTimeout(() => {
                navigate('/student/tests');
            }, 3000);
        }
    );

    // Extension Detection
    const { detectedExtensions, hasExtensions } = useExtensionDetection(
        attempt?.id,
        testStarted
    );

    // Keystroke Analysis
    const { copyPasteCount } = useKeystrokeAnalysis(
        attempt?.id,
        questions[currentQuestionIndex]?.id,
        testStarted
    );

    // IP Tracking
    const { ipAddress, ipChanged } = useIPTracking(
        attempt?.id,
        testStarted
    );

    // Violation Detection (Tab switch, Fullscreen, Window blur)
    useViolationDetection(attempt?.id, testId);

    // Screen Capture Detection (Screenshot, Phone camera)
    useScreenCaptureDetection(attempt?.id, testStarted);

    // Front-end Force Guard: Monitor fullscreen state directly
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (testStarted && !document.fullscreenElement && !isFrozen) {
                console.log('Frontend Guard: Fullscreen exited - Freezing UI');
                setIsFrozen(true);
                toast.error('Fullscreen exited! Test terminated.');

                // Permanent Fix: Force navigation away after 2 seconds
                // This prevents users from trying to unfreeze the UI via DevTools
                setTimeout(() => {
                    window.location.href = '/exam-terminated';
                }, 2000);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [testStarted, isFrozen]);

    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            initializeTest();
        }
        return () => {
            if (autoSaveInterval.current) {
                clearInterval(autoSaveInterval.current);
            }
        };
    }, [testId]);

    const initializeTest = async () => {
        try {
            console.log('=== INIT TEST START ===', testId);

            // 1. Try to get existing attempt
            let attemptData = null;
            try {
                console.log('Trying to get existing attempt...');
                attemptData = await getAttempt(testId);
                console.log('Found existing attempt:', attemptData);
                try {
                    toast.success('Resumed previous session');
                } catch (toastError) {
                    console.error('Toast error:', toastError);
                }
            } catch (e) {
                console.log('No existing attempt, will create new one');
            }

            // 2. If no existing attempt, start new one
            if (!attemptData) {
                console.log('Starting new test...');
                attemptData = await startTest(testId);
                console.log('Created new attempt:', attemptData);
            }

            setAttempt(attemptData);

            if (attemptData.status === 'SUBMITTED') {
                try {
                    toast.error('You have already submitted this test');
                } catch (toastError) {
                    console.error('Toast error:', toastError);
                }
                navigate('/student/history');
                return;
            }

            if (attemptData.status === 'FROZEN') {
                setIsFrozen(true);
            }
            console.log('Attempt set:', attemptData);

            // Fetch test details
            console.log('Fetching test details...');
            const { data: testData } = await testAPI.getStudentTest(testId);

            console.log('Test data received:', testData);
            console.log('Test questions:', testData.testQuestions);
            setTest(testData);

            // Setup questions from testQuestions
            if (testData.testQuestions && testData.testQuestions.length > 0) {
                console.log('Processing questions...');
                const mappedQuestions = testData.testQuestions
                    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                    .map((tq, idx) => {
                        console.log(`Question ${idx}:`, tq);

                        // Handle case where question object might not be fully populated
                        const questionData = tq.question || {};

                        // Guard against null/undefined question data
                        if (!tq.question) {
                            console.warn(`Question ${idx} has null question data:`, tq);
                        }

                        return {
                            ...questionData,
                            id: tq.questionId || questionData?.id || `temp-${idx}`,
                            marks: tq.marks || questionData?.marks || 1,
                            sectionName: tq.sectionName || 'General',
                            questionText: questionData?.questionText || 'Question text not available',
                            type: questionData?.type || 'MCQ',
                            // Ensure options are available for MCQ
                            optionA: questionData?.optionA || '',
                            optionB: questionData?.optionB || '',
                            optionC: questionData?.optionC || '',
                            optionD: questionData?.optionD || '',
                        };
                    });

                console.log('Mapped questions:', mappedQuestions);
                setQuestions(mappedQuestions);
            } else {
                console.warn('No test questions found in test data');
                setQuestions([]);
                try {
                    toast.error('This test has no questions');
                } catch (toastError) {
                    console.error('Toast error:', toastError);
                }
            }

            // Set timer based on actual server start time
            if (attemptData.startedAt) {
                // Parse startedAt (Assuming ISO string from backend, force UTC if no offset)
                let dateStr = attemptData.startedAt;
                if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
                    dateStr += 'Z';
                }
                const startTime = new Date(dateStr).getTime();
                const now = Date.now();
                const elapsedSeconds = Math.floor((now - startTime) / 1000);
                const totalSeconds = testData.durationMinutes * 60;

                // If elapsed > total, it's already expired
                const remaining = totalSeconds - elapsedSeconds;

                console.log(`Timer Sync: Started=${attemptData.startedAt}, Elapsed=${elapsedSeconds}s, Remaining=${remaining}s`);
                setTimeRemaining(remaining);
            } else {
                // Fallback (unsafe)
                setTimeRemaining(testData.durationMinutes * 60);
            }

            // Auto-save setup
            autoSaveInterval.current = setInterval(() => {
                saveCurrentAnswer();
            }, 30000);

            console.log('=== INIT TEST COMPLETE ===');
            setLoading(false);
        } catch (error) {
            console.error('=== TEST INIT ERROR ===', error);
            toast.error(error.message || 'Failed to start test');
            setLoading(false); // Make sure to stop loading even on error
            navigate('/student/tests');
        }
    };

    // Timer countdown
    useEffect(() => {
        // Prevent timer logic if test hasn't started or is loading or time is null
        if (!testStarted || loading || timeRemaining === null) return;

        // CRITICAL: If time is already up when we try to start, submit immediately
        if (timeRemaining <= 0) {
            console.warn('Auto-submitting: Time expired at start or during test');
            handleSubmitTest();
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitTest();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [testStarted, loading, timeRemaining === null]); // Only re-run when these core states change

    const formatTime = (seconds) => {
        if (seconds <= 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const saveCurrentAnswer = async () => {
        const question = questions[currentQuestionIndex];
        if (!question || !attempt || !question.id) {
            return;
        }

        const answer = question.type === 'MCQ'
            ? answers[question.id]
            : codeAnswers[question.id];

        if (answer) {
            try {
                await submitAnswer(attempt.id, question.id, answer);
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const handleCodeChange = (questionId, code) => {
        setCodeAnswers({ ...codeAnswers, [questionId]: code });
    };

    const handleRunCode = async (questionId) => {
        const code = codeAnswers[questionId];
        if (!code || !attempt) {
            toast.error('Please write some code first');
            return;
        }

        setIsExecuting(true);
        setExecutionResults({ ...executionResults, [questionId]: { status: { description: 'Running...' } } });

        try {
            const question = questions.find(q => q.id === questionId);
            const defaultLang = question?.allowedLanguageIds?.[0] || 62;
            const langId = selectedLanguages[questionId] || defaultLang;

            const result = await executeCode(attempt.id, questionId, code, langId, '');

            if (result.status === 'QUEUED') {
                toast.success('Submitted to queue...');
                pollExecutionResult(attempt.id, questionId, result.executionId);
            } else {
                setExecutionResults(prev => ({ ...prev, [questionId]: result }));
                toast.success('Code executed successfully');
                setIsExecuting(false);
            }
        } catch (error) {
            toast.error('Code execution failed');
            setIsExecuting(false);
        }
    };

    const pollExecutionResult = async (attemptId, questionId, executionId) => {
        const { exponentialBackoffPoll, getStatusMessage } = await import('../utils/pollingUtils');

        const pollFunction = async () => {
            const { data: result } = await testAPI.getExecutionResult(attemptId, questionId);
            return result;
        };

        const onUpdate = (result, attemptNumber, nextDelay) => {
            const message = getStatusMessage(result?.status, attemptNumber);

            setExecutionResults(prev => ({
                ...prev,
                [questionId]: {
                    ...result,
                    _pollingInfo: {
                        attempt: attemptNumber,
                        nextDelay: Math.round(nextDelay / 1000),
                        message
                    }
                }
            }));

            if (attemptNumber % 3 === 0) {
                toast.loading(
                    `${message} (attempt ${attemptNumber}, next check in ${Math.round(nextDelay / 1000)}s)`,
                    { id: 'execution-poll' }
                );
            }
        };

        const onComplete = (result) => {
            setExecutionResults(prev => ({ ...prev, [questionId]: result }));
            setIsExecuting(false);
            toast.dismiss('execution-poll');

            if (result.status === 'INTERNAL_ERROR') {
                toast.error(`Execution Error: ${result.error || 'Unknown error'}`, { duration: 5000 });
            } else if (result.passed) {
                toast.success('All test cases passed! ✓', { duration: 3000 });
            } else if (result.status?.includes('Compilation Error')) {
                toast.error('Compilation failed - check your code', { duration: 5000 });
            } else {
                toast.error('Some test cases failed', { duration: 4000 });
            }
        };

        const onTimeout = () => {
            setIsExecuting(false);
            toast.dismiss('execution-poll');
            toast.error(
                'Execution timed out after 30 attempts. Please try again.',
                { duration: 6000 }
            );

            setExecutionResults(prev => ({
                ...prev,
                [questionId]: {
                    status: 'TIMEOUT',
                    error: 'Execution timed out - please try again later',
                    executionId
                }
            }));
        };

        exponentialBackoffPoll(pollFunction, onUpdate, onComplete, onTimeout);
    };

    const handleSubmitTest = async () => {
        if (submitting) return;

        if (!attempt) {
            console.error('Cannot submit test: Attempt is null');
            return;
        }

        try {
            setSubmitting(true);
            await saveCurrentAnswer();
            await submitTest(attempt.id);
            toast.success('Test submitted successfully!');
            navigate('/student/history');
        } catch (error) {
            toast.error(error.message || 'Failed to submit test');
            setSubmitting(false);
        }
    };

    const goToQuestion = (index) => {
        saveCurrentAnswer();
        setCurrentQuestionIndex(index);
    };

    const handleBeginTest = async () => {
        if (timeRemaining !== null && timeRemaining <= 0) {
            toast.error('Session has already expired.');
            return;
        }

        try {
            await document.documentElement.requestFullscreen();
            setTestStarted(true);
            toast.success('Test started - Good luck!');
        } catch (error) {
            console.error('Fullscreen error:', error);
            toast.error('Please allow fullscreen to start the test');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="prof-spinner mb-4 mx-auto"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Initializing Assessment Pipeline...</p>
                </div>
            </div>
        );
    }

    const isExpired = timeRemaining !== null && timeRemaining <= 0;

    // Show Begin Test screen before starting
    if (!testStarted) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="max-w-3xl w-full relative">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

                    <div className="prof-panel p-10 relative z-10 border-t-4 border-t-indigo-500">
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                                <ClipboardList className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">{test?.title}</h1>
                            <p className="text-slate-400 text-lg max-w-xl mx-auto">{test?.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <div className="prof-card p-6 bg-slate-900/50 flex items-center gap-4 group hover:border-indigo-500/30 transition-colors">
                                <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                    <Clock className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Duration</p>
                                    <p className="text-xl font-bold text-white tracking-widest leading-none mt-1">{test?.durationMinutes}m</p>
                                </div>
                            </div>
                            <div className="prof-card p-6 bg-slate-900/50 flex items-center gap-4 group hover:border-indigo-500/30 transition-colors">
                                <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                    <ClipboardList className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuration</p>
                                    <p className="text-xl font-bold text-white tracking-widest leading-none mt-1">{questions.length} Items</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border-2 border-amber-500/20 rounded-2xl p-8 mb-10">
                            <h3 className="text-amber-400 font-bold flex items-center gap-3 mb-6 uppercase tracking-widest text-sm">
                                <ShieldAlert className="w-5 h-5" />
                                Critical Instructions
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                {[
                                    'Mandatory Fullscreen Mode',
                                    'Active Webcam Proctoring',
                                    'Tab Switching Disabled',
                                    'Copy/Paste Prohibited',
                                    'Auto-submission on Violations',
                                    'Real-time Integrity Monitoring'
                                ].map((instruction, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-amber-200/70">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40"></div>
                                        <span className="text-xs font-bold uppercase tracking-tight">{instruction}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {isExpired ? (
                            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center mb-6">
                                <p className="text-rose-400 font-bold uppercase tracking-widest text-sm mb-2">Assessment Session Expired</p>
                                <p className="text-slate-500 text-xs">The allocated time for this attempt has passed. You can no longer begin this session.</p>
                            </div>
                        ) : (
                            <button
                                onClick={handleBeginTest}
                                className="w-full btn-primary py-5 text-sm font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-[0_10px_40px_rgba(99,102,241,0.3)] hover:shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Rocket className="w-5 h-5" />
                                Authenticate & Begin
                            </button>
                        )}

                        <p className="text-center text-slate-600 text-[10px] mt-8 font-bold uppercase tracking-widest opacity-50">
                            By clicking Begin, you agree to the automated proctoring terms.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    if (isFrozen) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-red-900 bg-opacity-20 border border-red-600 rounded-2xl p-8 text-center backdrop-blur-sm">
                    <div className="text-6xl mb-4">❄️</div>
                    <h1 className="text-3xl font-bold text-white mb-4">Test Frozen</h1>
                    <p className="text-gray-300 mb-8">
                        This test session has been suspended due to multiple proctoring violations (e.g., switching tabs or browsers).
                    </p>
                    <div className="bg-red-600 bg-opacity-20 rounded-lg p-4 mb-8 text-red-200 text-sm">
                        You can no longer continue this test. Please contact your moderator for assistance.
                    </div>
                    <button
                        onClick={() => navigate('/student/history')}
                        className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-semibold"
                    >
                        Back to My History
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-[1600px] mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure you want to exit? Your progress will be saved but the timer will continue.")) {
                                    navigate('/student/tests');
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-widest">Exit Test</span>
                        </button>

                        <div className="h-8 w-px bg-white/5"></div>

                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight leading-none mb-1">{test?.title}</h2>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Question Workspace</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></div>
                                    <span className="text-xs font-bold text-indigo-400">Live Session Attempt</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-10">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Remaining Time</p>
                            <div className={`text-2xl font-mono font-bold tracking-tighter ${timeRemaining < 300 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                                {formatTime(timeRemaining)}
                            </div>
                        </div>

                        <button
                            onClick={() => setShowSubmitModal(true)}
                            className="btn-primary py-3 px-8 shadow-lg shadow-indigo-500/20"
                        >
                            Finalize Attempt
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6 h-[calc(100vh-80px)] overflow-hidden">
                {/* Left Sidebar: Navigator & Proctoring */}
                <div className="col-span-3 xl:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-none">
                    {/* Navigator */}
                    <div className="prof-panel p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Test Navigation</h3>
                            <span className="text-[10px] font-bold text-indigo-400 py-1 px-2 bg-indigo-500/10 rounded-lg">
                                {currentQuestionIndex + 1} / {questions.length}
                            </span>
                        </div>

                        <div className="flex-1 space-y-8">
                            {Object.entries(questions.reduce((acc, q, idx) => {
                                const section = q.sectionName || 'General';
                                if (!acc[section]) acc[section] = [];
                                acc[section].push({ q, idx });
                                return acc;
                            }, {})).map(([section, items]) => (
                                <div key={section}>
                                    <h4 className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mb-4 flex items-center gap-2">
                                        <div className="h-px flex-1 bg-white/5"></div>
                                        {section}
                                        <div className="h-px flex-1 bg-white/5"></div>
                                    </h4>
                                    <div className="grid grid-cols-4 gap-2">
                                        {items.map(({ q, idx }) => (
                                            <button
                                                key={q.id}
                                                onClick={() => goToQuestion(idx)}
                                                className={`aspect-square rounded-xl text-xs font-bold transition-all border-2 ${idx === currentQuestionIndex
                                                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20 scale-105'
                                                    : answers[q.id] || codeAnswers[q.id]
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-slate-900/50 text-slate-500 border-white/5 hover:border-slate-700 hover:text-slate-300'
                                                    }`}
                                            >
                                                {idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Completion Stats */}
                        <div className="mt-8 pt-6 border-t border-white/5">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
                                <span className="text-xs font-bold text-white">
                                    {Math.round((Object.keys({ ...answers, ...codeAnswers }).length / questions.length) * 100)}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700"
                                    style={{ width: `${(Object.keys({ ...answers, ...codeAnswers }).length / questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Proctoring Status Overlay */}
                    <div className="prof-panel p-5 mt-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Security</p>
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-tight">System Active</p>
                            </div>
                        </div>

                        {!loading && attempt && (
                            <div className="rounded-xl overflow-hidden border border-white/5 bg-slate-900/50 aspect-video relative group">
                                <WebcamPreview
                                    videoRef={videoRef}
                                    faceCount={faceCount}
                                    detectedObjects={detectedObjects}
                                    modelsLoaded={modelsLoaded}
                                    cameraStatus={cameraStatus}
                                    headRotation={headRotation}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                                <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${cameraStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">Proctoring Feed</span>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                            <div className="flex-1">
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Violations</p>
                                <p className={`text-xs font-bold ${(copyPasteCount || 0) + (aiViolationCount || 0) + (violations?.length || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {(copyPasteCount || 0) + (aiViolationCount || 0) + (violations?.length || 0)} Recorded
                                </p>
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-xs font-bold text-indigo-400 uppercase">Verified</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Question area */}
                <div className="col-span-9 xl:col-span-10 flex flex-col gap-6 h-full overflow-hidden">
                    <div className="prof-panel flex-1 flex flex-col min-h-0 overflow-hidden relative">
                        {/* Question Metadata Bar */}
                        <div className="px-8 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${currentQuestion?.type === 'MCQ'
                                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }`}>
                                    {currentQuestion?.type} Question
                                </span>
                                <span className="h-4 w-px bg-white/5"></span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weight: {currentQuestion?.marks} Point(s)</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auto-save synchronization active</span>
                            </div>
                        </div>

                        {/* Question Content Area */}
                        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-white/10">
                            {currentQuestion && (
                                <div className="max-w-4xl">
                                    <div className="mb-12">
                                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Problem Statement</h3>
                                        <p className="text-white text-2xl font-semibold leading-relaxed tracking-tight">
                                            {currentQuestion.questionText}
                                        </p>
                                    </div>

                                    {/* MCQ Content */}
                                    {currentQuestion.type === 'MCQ' && (
                                        <div className="space-y-4">
                                            <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">Select Option</h3>
                                            <div className="grid gap-4">
                                                {['A', 'B', 'C', 'D'].map((option) => (
                                                    <label
                                                        key={option}
                                                        className={`flex items-start p-6 rounded-2xl border-2 transition-all cursor-pointer group ${answers[currentQuestion.id] === option
                                                            ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                                                            : 'border-white/5 bg-slate-900/30 hover:border-white/10 hover:bg-slate-900/50'
                                                            }`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold mr-6 transition-all ${answers[currentQuestion.id] === option
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                            : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'
                                                            }`}>
                                                            {option}
                                                        </div>
                                                        <input
                                                            type="radio"
                                                            name={`question-${currentQuestion.id}`}
                                                            value={option}
                                                            checked={answers[currentQuestion.id] === option}
                                                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                                            className="hidden"
                                                        />
                                                        <span className={`text-lg font-medium pt-0.5 transition-colors ${answers[currentQuestion.id] === option ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                                            {currentQuestion[`option${option}`]}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Coding Content */}
                                    {currentQuestion.type === 'CODING' && (
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end">
                                                <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Integrated Development Environment</h3>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Select Runtime</span>
                                                    <select
                                                        className="bg-slate-900 text-indigo-400 border border-indigo-500/20 rounded-lg px-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                                                        value={selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguageIds?.[0] || 62}
                                                        onChange={(e) => setSelectedLanguages({
                                                            ...selectedLanguages,
                                                            ...{ [currentQuestion.id]: parseInt(e.target.value) }
                                                        })}
                                                    >
                                                        {(!currentQuestion.allowedLanguageIds || currentQuestion.allowedLanguageIds.includes(62)) && <option value="62">Java SE 21</option>}
                                                        {(!currentQuestion.allowedLanguageIds || currentQuestion.allowedLanguageIds.includes(71)) && <option value="71">Python 3.10</option>}
                                                        {(!currentQuestion.allowedLanguageIds || currentQuestion.allowedLanguageIds.includes(54)) && <option value="54">C++ GCC 20</option>}
                                                        {(!currentQuestion.allowedLanguageIds || currentQuestion.allowedLanguageIds.includes(50)) && <option value="50">C GCC 9.2.0</option>}
                                                        {(!currentQuestion.allowedLanguageIds || currentQuestion.allowedLanguageIds.includes(63)) && <option value="63">Node.js LTS</option>}
                                                        {(!currentQuestion.allowedLanguageIds || currentQuestion.allowedLanguageIds.includes(82)) && <option value="82">SQL (SQLite 3.31)</option>}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="prof-card p-0 overflow-hidden flex flex-col min-h-[500px] border-white/5">
                                                <div className="bg-slate-900/80 px-4 py-2 flex items-center justify-between border-b border-white/5">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/30"></div>
                                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30"></div>
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30"></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mono">source_code_buffer.v8</span>
                                                </div>
                                                <textarea
                                                    value={codeAnswers[currentQuestion.id] || currentQuestion.starterCode || ''}
                                                    onChange={(e) => handleCodeChange(currentQuestion.id, e.target.value)}
                                                    className="flex-1 w-full p-8 bg-slate-950/50 text-indigo-200 font-mono text-sm resize-none outline-none leading-relaxed placeholder-slate-700"
                                                    placeholder="// Implementation logic goes here..."
                                                    spellCheck="false"
                                                />
                                                <div className="p-4 border-t border-white/5 bg-slate-900/40 flex justify-between items-center">
                                                    <button
                                                        onClick={() => handleRunCode(currentQuestion.id)}
                                                        disabled={isExecuting}
                                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-3 shadow-lg shadow-indigo-600/20"
                                                    >
                                                        {isExecuting ? <div className="prof-spinner !w-3 !h-3"></div> : <Rocket className="w-3 h-3" />}
                                                        {isExecuting ? 'Analyzing Code...' : 'Evaluate & Run Test Cases'}
                                                    </button>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Environment: Linux (v.Latest)</span>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {executionResults[currentQuestion.id] && (
                                                <div className="prof-card p-6 bg-slate-950/80 border-l-4 border-l-indigo-500 animate-in slide-in-from-bottom-2 duration-300">
                                                    {executionResults[currentQuestion.id].error && executionResults[currentQuestion.id].error.startsWith("LOGIC BLOCK:") ? (
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-2 bg-rose-500/10 rounded-lg">
                                                                <AlertTriangle className="text-rose-500 w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h5 className="font-bold text-rose-500 text-sm uppercase tracking-widest mb-1">Security Restriction Breach</h5>
                                                                <p className="text-slate-400 text-sm font-medium">
                                                                    {executionResults[currentQuestion.id].error.replace("LOGIC BLOCK:", "").trim()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execution Result Pipeline</h4>
                                                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${executionResults[currentQuestion.id].passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                                    {executionResults[currentQuestion.id].passed ? 'Assessment Success' : 'Assessment Failure'}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Captured Output</span>
                                                                    </div>
                                                                    <pre className="text-emerald-400/90 text-sm font-mono bg-slate-950 p-4 rounded-xl border border-white/5 overflow-x-auto min-h-[100px]">
                                                                        {executionResults[currentQuestion.id].stdout ||
                                                                            executionResults[currentQuestion.id].error ||
                                                                            executionResults[currentQuestion.id].stderr ||
                                                                            'Process finished with null stream output'}
                                                                    </pre>
                                                                </div>

                                                                <div className="space-y-6">
                                                                    <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Runtime Status</span>
                                                                        <span className="text-xs font-bold text-white font-mono uppercase">
                                                                            {executionResults[currentQuestion.id].status?.description || 'TERMINATED'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time (ms)</span>
                                                                        <span className="text-xs font-bold text-white font-mono">
                                                                            {executionResults[currentQuestion.id].time || '0.00'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="px-8 py-6 border-t border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <button
                                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center gap-3 px-8 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-20 text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all border border-white/5"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Previous Problem
                            </button>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Question Information</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">System state verified & locked</p>
                                </div>

                                {!isLastQuestion ? (
                                    <button
                                        onClick={() => goToQuestion(currentQuestionIndex + 1)}
                                        className="btn-primary py-3 px-12 group"
                                    >
                                        Next Component
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowSubmitModal(true)}
                                        className="py-3 px-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20"
                                    >
                                        Final Assessment Submission
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Assessment Submit Confirmation Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="prof-panel p-10 max-w-lg w-full border-t-4 border-t-emerald-500 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 border border-emerald-500/20">
                            <ShieldAlert className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Final Submission?</h3>
                        <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                            Once submitted, your response will be finalized and locked for evaluation. You will no longer be able to modify your answers.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={handleSubmitTest}
                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-600/20"
                            >
                                Submit Final Attempt
                            </button>
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition-all font-bold uppercase tracking-widest text-xs border border-white/5"
                            >
                                Continue Working
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fixed Floating Proctoring Notice */}
            <ProctoringNotice violationCount={(copyPasteCount || 0) + (aiViolationCount || 0) + (violations?.length || 0)} />

            {/* Anti-Photo System Watermark Overlay */}
            {testStarted && attempt && (
                <AntiPhotoWatermark attemptId={attempt.id} />
            )}
        </div>
    );
}
