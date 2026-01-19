import { useEffect, useState } from 'react';
import { useTestStore } from '../store/testStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { Menu, X, Edit, Trash2, Eye, EyeOff, BarChart2 } from 'lucide-react';

export default function ModeratorTestsPage() {
    const { tests, loading, fetchTests, deleteTest } = useTestStore();
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });

    useEffect(() => {
        fetchTests();
    }, []);

    useEffect(() => {
        if (tests) {
            setStats({
                total: tests.length,
                published: tests.filter(t => t.status === 'PUBLISHED').length,
                draft: tests.filter(t => t.status === 'DRAFT').length
            });
        }
    }, [tests]);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
            toast.success('Logged out successfully');
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this test?')) {
            try {
                await deleteTest(id);
                toast.success('Test deleted successfully');
            } catch (error) {
                toast.error('Failed to delete test');
            }
        }
    };

    const handlePublish = async (test) => {
        const newStatus = test.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        const action = newStatus === 'PUBLISHED' ? 'publish' : 'unpublish';

        if (window.confirm(`Are you sure you want to ${action} this test?`)) {
            try {
                const { testAPI } = await import('../services/testAPI');
                await testAPI.publishTest(test.id, newStatus);
                toast.success(`Test ${action}ed successfully!`);
                fetchTests();
            } catch (error) {
                toast.error(`Failed to ${action} test`);
            }
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
                    <p className="text-white text-xl">Loading...</p>
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

            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
                <div className="relative z-50 backdrop-blur-xl bg-white/5 rounded-2xl p-6 mb-6 border border-white/10 shadow-glass">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                                Test Management
                            </h1>
                            <p className="text-gray-300">Manage and organize your tests</p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 backdrop-blur-sm text-white rounded-lg transition-all duration-300 border border-red-500/30"
                            >
                                Logout
                            </button>

                            {/* Hamburger Menu in the right corner */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-3 backdrop-blur-xl bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 border border-white/20 hover:border-cyan-400/50"
                                >
                                    {showMenu ? <X size={24} /> : <Menu size={24} />}
                                </button>

                                {showMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
                                            onClick={() => setShowMenu(false)}
                                        ></div>

                                        <div className="absolute right-0 mt-2 w-72 backdrop-blur-xl bg-white/10 rounded-xl shadow-glass border border-white/20 z-[100] overflow-hidden animate-slide-down origin-top-right">
                                            <div className="p-2">
                                                <button
                                                    onClick={() => {
                                                        navigate('/moderator/test');
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-4 text-white hover:bg-white/10 rounded-lg transition-all duration-300 group flex items-center gap-3"
                                                >
                                                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                                                        <span className="text-xl">➕</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-lg">Create Test</div>
                                                        <div className="text-xs text-gray-300">Build new assessment</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Total Tests</p>
                                <p className="text-4xl font-bold text-white">{stats.total}</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                                <span className="text-3xl">📚</span>
                            </div>
                        </div>
                    </div>

                    <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Published</p>
                                <p className="text-4xl font-bold text-green-400">{stats.published}</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                                <span className="text-3xl">✅</span>
                            </div>
                        </div>
                    </div>

                    <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Drafts</p>
                                <p className="text-4xl font-bold text-yellow-400">{stats.draft}</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-yellow-500/30">
                                <span className="text-3xl">📝</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Management Table */}
                {tests.length > 0 ? (
                    <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4 text-gray-300 font-semibold">Test Name</th>
                                        <th className="text-left p-4 text-gray-300 font-semibold">Type</th>
                                        <th className="text-left p-4 text-gray-300 font-semibold">Duration</th>
                                        <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                                        <th className="text-left p-4 text-gray-300 font-semibold">Start Date</th>
                                        <th className="text-right p-4 text-gray-300 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tests.map((test) => (
                                        <tr key={test.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="text-white font-medium">{test.title}</div>
                                                {test.description && (
                                                    <div className="text-gray-400 text-sm mt-1">{test.description.substring(0, 50)}{test.description.length > 50 ? '...' : ''}</div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                    {test.type?.replace('_ONLY', '')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-300">{test.durationMinutes} min</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 text-xs rounded-full ${test.status === 'PUBLISHED'
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                    }`}>
                                                    {test.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-300 text-sm">{formatDate(test.startDateTime)}</td>
                                            <td className="p-4">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => navigate(`/moderator/test/${test.id}`)}
                                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all duration-300 border border-blue-500/30"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/moderator/tests/${test.id}/analytics`)}
                                                        className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all duration-300 border border-purple-500/30"
                                                        title="View Reports (History)"
                                                    >
                                                        <BarChart2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePublish(test)}
                                                        className={`p-2 rounded-lg transition-all duration-300 border ${test.status === 'PUBLISHED'
                                                            ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border-yellow-500/30'
                                                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30'
                                                            }`}
                                                        title={test.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                                                    >
                                                        {test.status === 'PUBLISHED' ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(test.id)}
                                                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-300 border border-red-500/30"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-12 text-center border border-white/10">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-xl text-gray-300 mb-2">No tests created yet</p>
                        <p className="text-gray-400 mb-6">Create your first test to get started</p>
                        <button
                            onClick={() => navigate('/moderator/test')}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg font-semibold transition-all duration-300"
                        >
                            Create Test
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
