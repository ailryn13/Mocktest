import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function TestReviewPage() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReview();
    }, [testId]);

    const fetchReview = async () => {
        try {
            const { data } = await api.get(`/student/history/tests/${testId}/review`);
            setReview(data);
        } catch (error) {
            toast.error('Failed to load test review');
            navigate('/student/history');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading review...</div>
            </div>
        );
    }

    if (!review) return null;

    // Group questions by section
    // Group questions by section
    const groupedQuestions = {};
    const questionsList = Array.isArray(review?.questions) ? review.questions : [];

    // Debug logging
    console.log("Test Review Data:", review);
    console.log("Questions List:", questionsList);

    questionsList.forEach(q => {
        const section = q.sectionName || 'Part-I';
        if (!groupedQuestions[section]) groupedQuestions[section] = [];
        groupedQuestions[section].push(q);
    });

    return (
        <div className="min-h-screen bg-gray-950 p-8 text-gray-200">
            <div className="max-w-4xl mx-auto relative z-10">
                <div className="prof-panel p-8 mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{review?.test?.title || "Assessment Review"}</h1>
                        <p className="text-gray-400 text-sm">Detailed performance analysis and feedback</p>
                    </div>
                    <button
                        onClick={() => navigate('/student/tests')}
                        className="btn-secondary px-6"
                    >
                        Back to Home
                    </button>
                </div>

                <div className="space-y-12">
                    {Object.entries(groupedQuestions).map(([section, questions]) => (
                        <div key={section} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-bold text-blue-400 uppercase tracking-[0.2em]">{section}</h2>
                                <div className="h-px bg-white/5 flex-1"></div>
                            </div>

                            <div className="space-y-6">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="prof-card p-6 border-l-4 border-l-blue-500/50">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-500 font-bold text-xs">#{idx + 1}</span>
                                                <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-black tracking-widest text-white ${q.question.type === 'MCQ' ? 'bg-blue-600' : 'bg-blue-600'
                                                    }`}>
                                                    {q.question.type}
                                                </span>
                                            </div>
                                            <div className="bg-gray-900 px-4 py-1.5 rounded border border-white/5">
                                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mr-3">Performance</span>
                                                <span className={`font-mono font-bold ${q.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {q.correct ? q.marks : 0} <span className="text-gray-600">/</span> {q.marks}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-white text-lg mb-8 leading-relaxed font-medium">
                                            {q.question.questionText}
                                        </p>

                                        {q.question.type === 'MCQ' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {['A', 'B', 'C', 'D'].map(opt => (
                                                    <div
                                                        key={opt}
                                                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${opt === q.correctAnswer
                                                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100'
                                                            : opt === q.studentAnswer && !q.correct
                                                                ? 'border-rose-500/50 bg-rose-500/10 text-rose-100'
                                                                : 'border-white/5 bg-gray-900/50 text-gray-400'
                                                            }`}
                                                    >
                                                        <span className="text-sm font-medium">
                                                            <strong className="mr-3 text-xs opacity-50">{opt}.</strong>
                                                            {q.question[`option${opt}`]}
                                                        </span>
                                                        {opt === q.correctAnswer && (
                                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                                <span className="text-white text-xs font-bold">✓</span>
                                                            </div>
                                                        )}
                                                        {opt === q.studentAnswer && !q.correct && (
                                                            <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                                                                <span className="text-white text-xs font-bold">✗</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs overflow-x-auto border border-white/5">
                                                    <label className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 block">Submitted Logic</label>
                                                    <pre className="text-blue-300 leading-relaxed">{q.studentAnswer || '// No content provided'}</pre>
                                                </div>
                                                {q.executionResult && (
                                                    <div className="bg-gray-900 rounded-xl p-4 border border-white/5">
                                                        <label className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 block">System Telemetry</label>
                                                        <pre className="text-emerald-400 text-[10px] whitespace-pre-wrap leading-tight">
                                                            {q.executionResult.stdout || q.executionResult.stderr || 'Status: Handled'}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {q.explanation && (
                                            <div className="mt-8 p-5 bg-blue-500/5 border-l-4 border-l-blue-500 rounded-r-xl">
                                                <h4 className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">Expert Explanation</h4>
                                                <p className="text-gray-400 text-sm leading-relaxed">{q.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
