import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Home, Download, Users, CheckCircle, AlertTriangle, ArrowLeft, BarChart3 } from 'lucide-react';

export default function TestAnalyticsPage() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [testDetails, setTestDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('results');

    useEffect(() => {
        fetchData();
    }, [testId]);

    const fetchData = async () => {
        try {
            const [resultsRes, testRes] = await Promise.all([
                api.get(`/analytics/tests/${testId}/results`),
                api.get(`/tests/${testId}`)
            ]);
            setResults(resultsRes.data);
            setTestDetails(testRes.data);
        } catch (error) {
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await api.get(
                `/analytics/tests/${testId}/export/excel`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${testDetails?.title || 'test'}-results.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Excel exported successfully');
        } catch (error) {
            toast.error('Failed to export Excel');
        }
    };

    const getAttendedStudents = () => results.filter((r) => r.attendanceStatus === 'ATTENDED');
    const getAbsentStudents = () => results.filter((r) => r.attendanceStatus === 'NOT_ATTENDED');
    const getStudentsWithViolations = () => results.filter((r) => r.violationCount > 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
                    <p className="text-white text-xl">Loading reports...</p>
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
                {/* Top Navigation */}
                <button
                    onClick={() => navigate('/moderator/tests')}
                    className="mb-6 flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-all duration-300 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Management</span>
                </button>

                {/* Header Card */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 mb-8 border border-white/10 shadow-glass animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-glow-cyan">
                                <BarChart3 className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                    {testDetails?.title || 'Test Analytics'}
                                </h1>
                                <p className="text-gray-400 text-sm uppercase tracking-wider">{testDetails?.type?.replace('_ONLY', ' ')} Assessment</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportExcel}
                            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl transition-all duration-300 font-bold flex items-center justify-center gap-2 shadow-glow-green"
                        >
                            <Download className="w-5 h-5" />
                            Export Excel
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up">
                    <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Total Attended</p>
                                <p className="text-3xl font-black text-white">{getAttendedStudents().length}</p>
                            </div>
                            <Users className="text-cyan-400 w-8 h-8 opacity-50" />
                        </div>
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Pass Rate (Avg)</p>
                                <p className="text-3xl font-black text-green-400">
                                    {(getAttendedStudents().reduce((acc, curr) => acc + (curr.percentage || 0), 0) / (getAttendedStudents().length || 1)).toFixed(1)}%
                                </p>
                            </div>
                            <CheckCircle className="text-green-400 w-8 h-8 opacity-50" />
                        </div>
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Flagged Students</p>
                                <p className="text-3xl font-black text-red-400">{getStudentsWithViolations().length}</p>
                            </div>
                            <AlertTriangle className="text-red-400 w-8 h-8 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Tabs Glass Card */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex border-b border-white/10 bg-white/5">
                        <button
                            onClick={() => setActiveTab('results')}
                            className={`flex-1 px-6 py-4 font-bold transition-all duration-300 border-b-2 ${activeTab === 'results' ? 'text-cyan-400 border-cyan-400 bg-cyan-400/5' : 'text-gray-400 border-transparent hover:text-white'
                                }`}
                        >
                            Scores ({getAttendedStudents().length})
                        </button>
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`flex-1 px-6 py-4 font-bold transition-all duration-300 border-b-2 ${activeTab === 'attendance' ? 'text-cyan-400 border-cyan-400 bg-cyan-400/5' : 'text-gray-400 border-transparent hover:text-white'
                                }`}
                        >
                            Attendance ({results.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('violations')}
                            className={`flex-1 px-6 py-4 font-bold transition-all duration-300 border-b-2 ${activeTab === 'violations' ? 'text-red-400 border-red-400 bg-red-400/5' : 'text-gray-400 border-transparent hover:text-white'
                                }`}
                        >
                            Violations ({getStudentsWithViolations().length})
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'results' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/10 h-10">
                                            <th className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pb-4">Student</th>
                                            <th className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pb-4">Reg No</th>
                                            <th className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pb-4 text-center">Score</th>
                                            <th className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pb-4 text-center">Percentage</th>
                                            <th className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pb-4 text-center">Flags</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {getAttendedStudents().map((result) => (
                                            <tr key={result.studentId} className="hover:bg-white/5 transition-colors">
                                                <td className="py-4 font-semibold text-white">{result.studentName}</td>
                                                <td className="py-4 text-gray-400 font-mono text-sm">{result.registrationNumber}</td>
                                                <td className="py-4 text-center font-bold text-white">
                                                    {result.score?.toFixed(1)} / {result.totalMarks}
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full font-black text-xs ${result.percentage >= 80 ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                                            result.percentage >= 60 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                                                'bg-red-500/20 text-red-300 border border-red-500/30'
                                                        }`}>
                                                        {result.percentage?.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="py-4 text-center">
                                                    {result.violationCount > 0 ? (
                                                        <span className="flex items-center justify-center gap-1 text-red-400 font-bold animate-pulse">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            {result.violationCount}
                                                        </span>
                                                    ) : (
                                                        <span className="text-green-500 font-bold">CLEAN</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-green-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        Present ({getAttendedStudents().length})
                                    </h3>
                                    <div className="space-y-2">
                                        {getAttendedStudents().map((result) => (
                                            <div key={result.studentId} className="p-3 bg-white/5 rounded-xl border border-white/5 text-white flex justify-between">
                                                <span>{result.studentName}</span>
                                                <span className="text-gray-500 text-xs font-mono">{result.registrationNumber}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-red-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        Absent ({getAbsentStudents().length})
                                    </h3>
                                    <div className="space-y-2">
                                        {getAbsentStudents().map((result) => (
                                            <div key={result.studentId} className="p-3 bg-white/5 rounded-xl border border-white/5 text-gray-500 flex justify-between">
                                                <span>{result.studentName}</span>
                                                <span className="text-gray-600 text-xs font-mono">{result.registrationNumber}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'violations' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/10 h-10">
                                            <th className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pb-4">Student</th>
                                            <th className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pb-4 text-center">Total Count</th>
                                            <th className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pb-4">Summary of Offences</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {getStudentsWithViolations().map((result) => (
                                            <tr key={result.studentId} className="hover:bg-red-500/5 transition-colors">
                                                <td className="py-4 font-semibold text-white">
                                                    {result.studentName}
                                                    <div className="text-xs text-gray-400 font-mono mt-0.5">{result.registrationNumber}</div>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className="text-red-400 font-black text-lg">{result.violationCount}</span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                                                        {result.violationSummary &&
                                                            Object.entries(result.violationSummary).map(([type, count]) => (
                                                                <span key={type} className="px-2 py-1 bg-white/10 rounded-md border border-white/10 text-gray-300 uppercase">
                                                                    {type.replace(/_/g, ' ')}: {count}
                                                                </span>
                                                            ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
