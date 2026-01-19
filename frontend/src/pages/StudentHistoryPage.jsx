import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, History, ExternalLink, AlertTriangle, PlayCircle } from 'lucide-react';

export default function StudentHistoryPage() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/student/history');
            setHistory(data);
        } catch (error) {
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
                    <p className="text-white text-xl">Loading history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow"></div>
                <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <button
                    onClick={() => navigate('/student/tests')}
                    className="mb-8 flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-all duration-300 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Dashboard</span>
                </button>

                <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 mb-8 border border-white/10 shadow-glass animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-glow-cyan">
                            <History className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                My Test History
                            </h1>
                            <p className="text-gray-400">Review your past performance and detailed feedback</p>
                        </div>
                    </div>
                </div>

                {history.length === 0 ? (
                    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-20 text-center border border-white/10 animate-scale-in">
                        <div className="text-7xl mb-6">📊</div>
                        <p className="text-2xl text-white font-semibold mb-2">No test history yet</p>
                        <p className="text-gray-400 max-w-md mx-auto">Complete some tests to see your history, scores, and detailed reviews here.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 animate-slide-up">
                        {history.map((attempt, index) => (
                            <TestHistoryCard
                                key={attempt.id}
                                attempt={attempt}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TestHistoryCard({ attempt, index }) {
    const navigate = useNavigate();

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const safeDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
        const date = new Date(safeDateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const percentage = attempt.totalMarks ? (attempt.score / attempt.totalMarks) * 100 : 0;

    const getBadgeStyle = () => {
        if (percentage >= 80) return 'from-green-500 to-emerald-500 shadow-glow-green';
        if (percentage >= 60) return 'from-yellow-500 to-orange-500 shadow-glow-orange';
        return 'from-red-500 to-pink-500 shadow-glow-red';
    };

    return (
        <div
            className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-cyan-400/30 transition-all duration-500 hover:bg-white/10 group"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {attempt.testTitle || `Test #${attempt.testId}`}
                        </h3>
                        {attempt.status === 'FROZEN' && (
                            <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-full border border-red-500/30 uppercase tracking-wider">
                                Frozen
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                            <span>Started: {formatDate(attempt.startedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            <span>Submitted: {formatDate(attempt.submittedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <span>Status: <span className="font-semibold text-blue-300 uppercase">{attempt.status}</span></span>
                        </div>
                    </div>

                    {attempt.violationCount > 0 && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="text-red-400 shrink-0 w-5 h-5" />
                            <div>
                                <p className="text-red-300 font-semibold text-sm">
                                    {attempt.violationCount} Proctoring Violations Detected
                                </p>
                                {attempt.autoSubmitted && (
                                    <p className="text-red-400/80 text-xs mt-1">⚠️ Restricted due to critical violation policies.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center gap-4">
                    {attempt.totalMarks > 0 && (
                        <div className={`bg-gradient-to-br ${getBadgeStyle()} w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 border-white/10 group-hover:scale-110 transition-transform duration-500`}>
                            <div className="text-2xl font-black text-white">{attempt.score.toFixed(1)}</div>
                            <div className="text-[10px] text-white/80 font-bold uppercase tracking-widest">Marks</div>
                            <div className="h-px w-8 bg-white/30 my-1"></div>
                            <div className="text-white font-black">{percentage.toFixed(1)}%</div>
                        </div>
                    )}

                    <div className="w-full flex flex-col gap-2">
                        {(attempt.status === 'SUBMITTED' || attempt.status === 'FROZEN' || new Date(attempt.testEndDate) < new Date()) ? (
                            <button
                                onClick={() => navigate(`/student/history/tests/${attempt.testId}/review`)}
                                className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white rounded-xl transition-all duration-300 font-bold flex items-center justify-center gap-2 border border-white/10 hover:border-cyan-400/50"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Review
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate(`/student/test/${attempt.testId}`)}
                                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl transition-all duration-300 font-bold flex items-center justify-center gap-2 shadow-glow-cyan"
                            >
                                <PlayCircle className="w-4 h-4" />
                                Resume
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
