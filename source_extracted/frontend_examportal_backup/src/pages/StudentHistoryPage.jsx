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
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="prof-spinner mb-4 mx-auto"></div>
                    <p className="text-gray-400">Loading your history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-200">
            <div className="max-w-6xl mx-auto p-6 relative z-10">
                <button
                    onClick={() => navigate('/student/tests')}
                    className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-trangray-x-1 transition-transform" />
                    Back to Home
                </button>

                <div className="prof-panel p-6 mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                        <History className="text-blue-400 w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Performance History</h1>
                        <p className="text-gray-400 text-sm">Review your past evaluations and feedback</p>
                    </div>
                </div>

                {history.length === 0 ? (
                    <div className="prof-panel p-20 text-center">
                        <div className="text-5xl mb-6 opacity-20">📊</div>
                        <h3 className="text-xl font-semibold text-white mb-2">No history recorded</h3>
                        <p className="text-gray-400 max-w-sm mx-auto">Once you complete your first assessment, it will appear here with detailed performance metrics.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
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

    const getScoreStyle = () => {
        if (percentage >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (percentage >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    };

    return (
        <div className="prof-card p-6 border-l-4 border-l-blue-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">
                            {attempt.testTitle || `Evaluation #${attempt.testId}`}
                        </h3>
                        {attempt.status === 'FROZEN' && (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded border border-rose-500/20 uppercase tracking-widest">
                                Suspended
                            </span>
                        )}
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] font-bold rounded border border-white/5 uppercase tracking-widest">
                            {attempt.status}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                            Started: {formatDate(attempt.startedAt)}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                            Submitted: {formatDate(attempt.submittedAt)}
                        </div>
                    </div>

                    {attempt.violationCount > 0 && (
                        <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg inline-flex items-center gap-3">
                            <AlertTriangle className="text-rose-500 w-4 h-4" />
                            <span className="text-rose-400 font-semibold text-xs">
                                {attempt.violationCount} Integrity Violations Flagged
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-8 min-w-max">
                    {attempt.totalMarks > 0 && (
                        <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 ${getScoreStyle()}`}>
                            <div className="text-lg font-bold">{(attempt.score ?? 0).toFixed(1)}</div>
                            <div className="text-[8px] font-black uppercase tracking-tighter opacity-60">of {attempt.totalMarks}</div>
                            <div className="text-xs font-black mt-1">{percentage.toFixed(0)}%</div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 w-32">
                        {(attempt.status === 'SUBMITTED' || attempt.status === 'FROZEN' || new Date(attempt.testEndDate) < new Date()) ? (
                            <button
                                onClick={() => navigate(`/student/history/tests/${attempt.testId}/review`)}
                                className="btn-secondary w-full py-2 flex items-center justify-center gap-2 text-xs"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Review
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate(`/student/test/${attempt.testId}`)}
                                className="btn-primary w-full py-2 flex items-center justify-center gap-2 text-xs"
                            >
                                <PlayCircle className="w-3.5 h-3.5" />
                                Resume
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
