import { useEffect, useState } from 'react';
import { useTestStore } from '../store/testStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { Menu, X, Edit, Trash2, Eye, EyeOff, BarChart2, Layout, Plus, LogOut, Clock, FileText, Activity, ChevronRight, Search } from 'lucide-react';

export default function ModeratorTestsPage() {
    const { tests, loading, fetchTests, deleteTest } = useTestStore();
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });
    const [searchQuery, setSearchQuery] = useState('');

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
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const filteredTests = tests?.filter(test =>
        test.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="prof-spinner mb-4" />
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Loading assessments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                            <Layout size={28} className="text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                Assessments
                            </h1>
                            <p className="text-xs font-medium text-slate-500 mt-1">
                                Manage and monitor your examination protocols
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search tests..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:border-indigo-500/50 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => navigate('/moderator/test')}
                            className="btn-primary flex items-center space-x-2 whitespace-nowrap"
                        >
                            <Plus size={18} />
                            <span>Create Assessment</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[
                        { label: 'Total Assessments', value: stats.total, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                        { label: 'Published & Live', value: stats.published, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                        { label: 'Draft Mode', value: stats.draft, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
                    ].map((stat, i) => (
                        <div key={i} className="prof-panel p-6 group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white tracking-tight">{stat.value || '0'}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tests Table */}
                {filteredTests.length > 0 ? (
                    <div className="prof-panel overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="prof-table">
                                <thead>
                                    <tr>
                                        <th>Protocol Title</th>
                                        <th>Type</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                        <th>Scheduled For</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTests.map((test) => (
                                        <tr key={test.id} className="group">
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                                                        {test.title}
                                                    </span>
                                                    <span className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xs">
                                                        {test.description || 'No description provided'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                    {test.type?.replace('_ONLY', '')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center text-slate-400 tabular-nums">
                                                    <Clock size={12} className="mr-1.5 opacity-50" />
                                                    <span>{test.durationMinutes}m</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center space-x-2">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${test.status === 'PUBLISHED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500'}`} />
                                                    <span className={`text-xs font-medium ${test.status === 'PUBLISHED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        {test.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-xs text-slate-500 tabular-nums">
                                                    {formatDate(test.startDateTime)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => navigate(`/moderator/test/${test.id}`)}
                                                        className="p-2 bg-slate-800/50 hover:bg-indigo-600/20 text-indigo-400 rounded-lg transition-colors border border-transparent hover:border-indigo-500/30"
                                                        title="Edit Protocol"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/moderator/tests/${test.id}/analytics`)}
                                                        className="p-2 bg-slate-800/50 hover:bg-violet-600/20 text-violet-400 rounded-lg transition-colors border border-transparent hover:border-violet-500/30"
                                                        title="Analytics"
                                                    >
                                                        <BarChart2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePublish(test)}
                                                        className={`p-2 bg-slate-800/50 rounded-lg transition-colors border border-transparent ${test.status === 'PUBLISHED'
                                                                ? 'text-amber-400 hover:bg-amber-600/20 hover:border-amber-500/30'
                                                                : 'text-emerald-400 hover:bg-emerald-600/20 hover:border-emerald-500/30'
                                                            }`}
                                                        title={test.status === 'PUBLISHED' ? 'Move to Draft' : 'Publish Live'}
                                                    >
                                                        {test.status === 'PUBLISHED' ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(test.id)}
                                                        className="p-2 bg-slate-800/50 hover:bg-rose-600/20 text-rose-400 rounded-lg transition-colors border border-transparent hover:border-rose-500/30"
                                                        title="Delete Protocol"
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
                    <div className="prof-panel p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
                            <FileText size={40} className="text-slate-700" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No Assessments Found</h2>
                        <p className="text-sm text-slate-500 max-w-sm mb-8">
                            {searchQuery ? `No results matching "${searchQuery}"` : "You haven't created any assessments yet. Start by creating a new protocol."}
                        </p>
                        <button
                            onClick={() => navigate('/moderator/test')}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <Plus size={20} />
                            <span>Create First Assessment</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
