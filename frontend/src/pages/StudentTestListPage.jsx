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
            setCompletedTestIds(completed);
            setInProgressTestIds(inProgress);
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
        const active = [];
        const expired = [];

        tests.forEach((test) => {
            const start = new Date(test.startDateTime);
            const end = new Date(test.endDateTime);

            if (now < start) {
                upcoming.push(test);
            } else if (now > end) {
                expired.push(test);
            } else {
                active.push(test);
            }
        });

        return { upcoming, active, expired };
    };

    const { upcoming, active, expired } = categorizeTests();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
                    <p className="text-white text-xl">Loading tests...</p>
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

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 mb-6 border border-white/10 shadow-glass">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                                My Tests
                            </h1>
                            <p className="text-gray-300">Welcome back, {user?.name || 'Student'}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/student/history')}
                                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white rounded-lg transition-all duration-300 border border-white/10 hover:border-cyan-400/50"
                            >
                                History
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 backdrop-blur-sm text-white rounded-lg transition-all duration-300 border border-red-500/30"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Active Tests */}
                {active.length > 0 && (
                    <section className="mb-8 animate-slide-up">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span className="inline-block w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-glow-sm"></span>
                            <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Active Now</span>
                        </h2>
                        <div className="grid gap-4">
                            {active.map((test) => (
                                <TestCard
                                    key={test.id}
                                    test={test}
                                    status="active"
                                    navigate={navigate}
                                    isCompleted={completedTestIds.has(test.id)}
                                    isInProgress={inProgressTestIds.has(test.id)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Upcoming Tests */}
                {upcoming.length > 0 && (
                    <section className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-2xl font-semibold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
                            Upcoming
                        </h2>
                        <div className="grid gap-4">
                            {upcoming.map((test) => (
                                <TestCard key={test.id} test={test} status="upcoming" navigate={navigate} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Expired Tests */}
                {expired.length > 0 && (
                    <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-2xl font-semibold text-gray-400 mb-4">Past Tests</h2>
                        <div className="grid gap-4">
                            {expired.map((test) => (
                                <TestCard key={test.id} test={test} status="expired" navigate={navigate} />
                            ))}
                        </div>
                    </section>
                )}

                {tests.length === 0 && (
                    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-12 text-center border border-white/10">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="text-xl text-gray-300 mb-2">No tests available at the moment</p>
                        <p className="text-gray-400">Check back later for upcoming tests</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function TestCard({ test, status, navigate, isCompleted, isInProgress }) {
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
            border: 'border-green-400/30',
            badge: 'bg-gradient-to-r from-green-500 to-cyan-500',
            glow: 'shadow-glow-cyan'
        },
        upcoming: {
            border: 'border-yellow-400/30',
            badge: 'bg-gradient-to-r from-yellow-500 to-orange-500',
            glow: ''
        },
        expired: {
            border: 'border-gray-600/30',
            badge: 'bg-gray-600',
            glow: ''
        }
    };

    const config = statusConfig[status];

    return (
        <div className={`backdrop-blur-xl bg-white/5 rounded-xl p-6 border ${config.border} ${config.glow} transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 group`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">{test.title}</h3>
                    {test.description && (
                        <p className="text-gray-300 mb-3 text-sm">{test.description}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                        <span className={`px-3 py-1 text-xs rounded-full backdrop-blur-sm ${test.type === 'MCQ_ONLY' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                test.type === 'CODING_ONLY' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                    'bg-green-500/20 text-green-300 border border-green-500/30'
                            }`}>
                            {test.type?.replace('_ONLY', '')}
                        </span>
                    </div>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold text-white text-sm ${config.badge}`}>
                    {status === 'active' ? 'LIVE' :
                        status === 'upcoming' ? 'UPCOMING' : 'ENDED'}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
                <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-gray-400 text-xs mb-1">Start Time</p>
                    <p className="text-white font-medium">{formatDate(test.startDateTime)}</p>
                </div>
                <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-gray-400 text-xs mb-1">End Time</p>
                    <p className="text-white font-medium">{formatDate(test.endDateTime)}</p>
                </div>
                <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-gray-400 text-xs mb-1">Duration</p>
                    <p className="text-white font-medium">{test.durationMinutes} min</p>
                </div>
            </div>

            {status === 'active' && (
                <>
                    <p className="text-yellow-300 mb-4 font-medium text-center bg-yellow-500/10 py-2 rounded-lg border border-yellow-500/20">
                        ⏱️ {getTimeDifference()}
                    </p>
                    {isCompleted ? (
                        <button
                            onClick={() => navigate('/student/history')}
                            className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white rounded-lg transition-all duration-300 font-semibold border border-white/20"
                        >
                            View Results (Completed)
                        </button>
                    ) : isInProgress ? (
                        <button
                            onClick={handleStartTest}
                            className="relative w-full px-6 py-4 rounded-lg font-semibold text-white overflow-hidden group transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative z-10">Resume Test →</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleStartTest}
                            className="relative w-full px-6 py-4 rounded-lg font-semibold text-white overflow-hidden group transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-cyan-500"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative z-10">Start Test →</span>
                        </button>
                    )}
                </>
            )}

            {status === 'upcoming' && (
                <div className="text-gray-300 text-center py-3 bg-white/5 rounded-lg border border-white/10">
                    Test starts {formatDate(test.startDateTime)}
                </div>
            )}

            {status === 'expired' && (
                <button
                    className="w-full px-6 py-3 bg-white/5 text-gray-400 rounded-lg cursor-not-allowed border border-white/10"
                    disabled
                >
                    Test Ended
                </button>
            )}
        </div>
    );
}
