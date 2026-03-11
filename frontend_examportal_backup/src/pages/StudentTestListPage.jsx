import { useEffect, useState } from 'react';
import api from '../services/api';
import { useTestStore } from '../store/testStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentTestListPage() {
    const { tests, loading, fetchAvailableTests } = useTestStore();
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const [completedTestIds, setCompletedTestIds] = useState(new Set());
    const [inProgressTestIds, setInProgressTestIds] = useState(new Set());
    const [attemptMapping, setAttemptMapping] = useState({});
    const [completedTests, setCompletedTests] = useState([]);
    const [activeTab, setActiveTab] = useState('ongoing');

    useEffect(() => {
        fetchAvailableTests();
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/student/history');
            const completed = new Set(
                data.filter(a => a.status === 'SUBMITTED' || a.status === 'FROZEN')
                    .map(a => a.testId)
            );
            const inProgress = new Set(
                data.filter(a => a.status === 'IN_PROGRESS' || a.status === 'STARTED')
                    .map(a => a.testId)
            );

            // Map testId to attemptId for direct review links
            const attemptMap = {};
            data.forEach(a => {
                attemptMap[a.testId] = a.id;
            });

            // Build complete test objects for completed tests
            const completedAttempts = data.filter(a => a.status === 'SUBMITTED' || a.status === 'FROZEN');
            const completedTestObjects = completedAttempts.map(attempt => ({
                id: attempt.testId,
                title: attempt.testTitle,
                type: 'CODING', // Default, will be updated if we fetch full test details
                durationMinutes: attempt.durationMinutes || 0,
                startDateTime: attempt.startedAt,
                endDateTime: attempt.testEndDate,
                description: '',
                status: 'PUBLISHED',
                // Store attempt info for easy access
                attemptStatus: attempt.status,
                attemptId: attempt.id,
                score: attempt.score,
                totalMarks: attempt.totalMarks
            }));

            setCompletedTestIds(completed);
            setInProgressTestIds(inProgress);
            setAttemptMapping(attemptMap);
            setCompletedTests(completedTestObjects);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
            toast.success('Logged out successfully');
        }
    }

    const categorizeTests = () => {
        const now = new Date();
        const upcoming = [];
        const ongoing = [];
        const completed = [];
        const expired = [];

        tests.forEach((test) => {
            const start = new Date(test.startDateTime);
            const end = new Date(test.endDateTime);
            const isDone = completedTestIds.has(test.id);

            if (now < start) {
                upcoming.push(test);
            } else if (isDone) {
                completed.push(test);
            } else if (now > end) {
                expired.push(test);
            } else {
                ongoing.push(test);
            }
        });

        return { upcoming, ongoing, completed, expired };
    };

    const { upcoming, ongoing, completed, expired } = categorizeTests();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="prof-spinner mb-4 mx-auto"></div>
                    <p className="text-gray-400">Loading assessments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-200">
            <div className="max-w-7xl mx-auto p-6 relative z-10">
                {/* Header */}
                <div className="prof-panel p-6 mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Assessments</h1>
                        <p className="text-gray-400 text-sm">Welcome, {user?.name || 'Student'}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/student/history')}
                            className="btn-secondary flex items-center gap-2"
                        >
                            View History
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn-danger"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-4 mb-8 max-w-4xl mx-auto border-b border-white/5 pb-4">
                    <button
                        onClick={() => setActiveTab('ongoing')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 border-2 ${activeTab === 'ongoing'
                            ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                            : 'bg-transparent border-white/5 text-gray-500 hover:border-white/20'
                            }`}
                    >
                        Ongoing ({ongoing.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 border-2 ${activeTab === 'completed'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                            : 'bg-transparent border-white/5 text-gray-500 hover:border-white/20'
                            }`}
                    >
                        Completed ({completedTests.length})
                    </button>
                </div>

                <div className="max-w-4xl mx-auto">
                    {activeTab === 'ongoing' ? (
                        /* Ongoing Tests */
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <div className="status-indicator status-active prof-pulse"></div>
                                Active Assessments
                            </h2>
                            {ongoing.length > 0 ? (
                                <div className="space-y-6">
                                    {ongoing.map((test) => (
                                        <TestCard
                                            key={test.id}
                                            test={test}
                                            status="active"
                                            navigate={navigate}
                                            isCompleted={false}
                                            isInProgress={inProgressTestIds.has(test.id)}
                                            attemptId={attemptMapping[test.id]}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="prof-card p-12 text-center bg-gray-900/40 border-dashed border-2 border-white/5">
                                    <div className="text-3xl mb-4 opacity-20">🎯</div>
                                    <p className="text-gray-500 font-medium">No ongoing assessments at the moment</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Completed Tests */
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                Past Successes
                            </h2>
                            {completedTests.length > 0 ? (
                                <div className="space-y-6">
                                    {completedTests.map((test) => (
                                        <TestCard
                                            key={test.id}
                                            test={test}
                                            status="active"
                                            navigate={navigate}
                                            isCompleted={true}
                                            isInProgress={false}
                                            attemptId={test.attemptId}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="prof-card p-12 text-center bg-gray-900/40 border-dashed border-2 border-white/5">
                                    <div className="text-3xl mb-4 opacity-20">🏆</div>
                                    <p className="text-gray-500 font-medium">No completed assessments yet</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-16 pt-10 border-t border-white/5">

                    {/* Upcoming Tests */}
                    {upcoming.length > 0 && (
                        <section className="mb-10">
                            <h2 className="text-lg font-semibold text-gray-400 mb-6 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                                Upcoming Assessments
                            </h2>
                            <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
                                {upcoming.map((test) => (
                                    <TestCard key={test.id} test={test} status="upcoming" navigate={navigate} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Expired Tests */}
                    {expired.length > 0 && (
                        <section className="opacity-75">
                            <h2 className="text-lg font-semibold text-gray-500 mb-6 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                                Past Sessions
                            </h2>
                            <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
                                {expired.map((test) => (
                                    <TestCard key={test.id} test={test} status="expired" navigate={navigate} />
                                ))}
                            </div>
                        </section>
                    )}

                    {tests.length === 0 && (
                        <div className="prof-panel p-16 text-center">
                            <div className="text-4xl mb-4">📖</div>
                            <h3 className="text-xl font-bold text-white mb-2">No active assessments</h3>
                            <p className="text-gray-400 max-w-sm mx-auto">There are currently no scheduled tests available for your department. Please check back later.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TestCard({ test, status, navigate, isCompleted, isInProgress, attemptId }) {
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTimeDifference = () => {
        if (status !== 'active') return null;

        const now = new Date();
        const end = new Date(test.endDateTime);
        const diff = end - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m remaining`;
    };

    const handleStartTest = () => {
        navigate(`/student/test/${test.id}`);
    };

    const statusConfig = {
        active: {
            badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            label: 'Active'
        },
        upcoming: {
            badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            label: 'Scheduled'
        },
        expired: {
            badge: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
            label: 'Ended'
        }
    };

    const config = statusConfig[status];

    return (
        <div className="prof-card p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">{test.title}</h3>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                            {test.type?.replace('_ONLY', '')}
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 border border-white/5 rounded">
                            {test.durationMinutes} Min
                        </span>
                    </div>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${config.badge}`}>
                    {config.label}
                </span>
            </div>

            {test.description && (
                <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                    {test.description}
                </p>
            )}

            <div className="space-y-3 mb-6 mt-auto">
                <div className="flex justify-between items-center text-xs py-2 border-b border-white/5">
                    <span className="text-gray-500">Scheduled Date</span>
                    <span className="text-gray-300 font-medium">{formatDate(test.startDateTime)}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-2 border-b border-white/5">
                    <span className="text-gray-500">Deadline</span>
                    <span className="text-gray-300 font-medium">{formatDate(test.endDateTime)}</span>
                </div>
            </div>

            {status === 'active' && (
                <div className="space-y-4">
                    <div className="text-center bg-gray-900/50 py-2 rounded border border-white/5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Time Remaining</span>
                        <span className="text-amber-400 font-mono font-bold tracking-tight">
                            {getTimeDifference()}
                        </span>
                    </div>

                    {isCompleted ? (
                        <button
                            onClick={() => navigate(`/student/history/tests/${test.id}/review`)}
                            className="w-full btn-secondary"
                        >
                            View Results
                        </button>
                    ) : isInProgress ? (
                        <button
                            onClick={handleStartTest}
                            className="w-full btn-primary"
                        >
                            Resume Session →
                        </button>
                    ) : (
                        <button
                            onClick={handleStartTest}
                            className="w-full btn-primary"
                        >
                            Start Assessment →
                        </button>
                    )}
                </div>
            )}

            {status === 'upcoming' && (
                <div className="p-3 bg-gray-900/50 rounded border border-white/5 text-center text-xs text-gray-400">
                    Registration confirmed. Starts at scheduled time.
                </div>
            )}

            {status === 'expired' && (
                <button
                    className="w-full px-4 py-2 rounded-lg bg-gray-800/50 text-gray-600 font-medium cursor-not-allowed border border-white/5"
                    disabled
                >
                    Session Unavailable
                </button>
            )}
        </div>
    );
}
