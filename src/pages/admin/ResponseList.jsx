import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Search, Eye, X, CheckCircle, XCircle } from 'lucide-react';
import LoadingScreen from '../../components/LoadingScreen';
import SearchableDropdown from '../../components/SearchableDropdown';
import Modal from '../../components/Modal';

const ResponseList = () => {
    const [responses, setResponses] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuizId, setSelectedQuizId] = useState('all');

    const [selectedResponse, setSelectedResponse] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: qData } = await supabase.from('quizzes').select('id, title');
                setQuizzes([{ id: 'all', title: 'All Quizzes' }, ...(qData || [])]);

                const { data: rData, error: rError } = await supabase
                    .from('responses')
                    .select('*, quizzes!inner(title, id)')
                    .order('submitted_at', { ascending: false });

                if (rError) throw rError;
                setResponses(rData);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load responses.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchResponseDetails = async (response) => {
        setSelectedResponse(response);
        setIsDetailsOpen(true);
        setDetailsLoading(true);
        try {
            const { data: questions, error } = await supabase
                .from('questions')
                .select('*')
                .eq('quiz_id', response.quiz_id)
                .order('order', { ascending: true });

            if (error) throw error;
            setQuizQuestions(questions || []);
        } catch (err) {
            console.error('Error fetching questions:', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const filteredResponses = responses.filter(r => {
        const matchesSearch = r.respondent_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesQuiz = selectedQuizId === 'all' || r.quiz_id === selectedQuizId;
        return matchesSearch && matchesQuiz;
    });

    if (loading) return <LoadingScreen fullScreen={false} />;

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-brand-primary">Quiz Responses</h1>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <SearchableDropdown
                        options={quizzes}
                        value={selectedQuizId}
                        onChange={setSelectedQuizId}
                        labelField="title"
                        valueField="id"
                        placeholder="Filter by Quiz"
                        className="w-full md:w-60"
                    />

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Search NV..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/30 border border-brand-border text-brand-primary pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                        />
                    </div>
                </div>
            </div>

            {error && <div className="text-red-400 mb-4">{error}</div>}

            <div className="bg-black/20 border border-brand-border rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-brand-secondary text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold">NV</th>
                                <th className="p-4 font-bold">Quiz</th>
                                <th className="p-4 font-bold">Score</th>
                                <th className="p-4 font-bold">Date</th>
                                <th className="p-4 font-bold text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/30">
                            {filteredResponses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-brand-secondary">
                                        No responses found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredResponses.map(response => {
                                    const totalQuestions = response.answers ? Object.keys(response.answers).length : 0;
                                    return (
                                        <tr key={response.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-brand-primary group-hover:text-white transition-colors">{response.respondent_name}</div>
                                                <div className="text-[10px] text-brand-secondary font-mono mt-1 opacity-50">#{response.id.slice(0, 8)}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-brand-secondary text-sm">{response.quizzes?.title || 'Unknown Quiz'}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xl text-brand-primary leading-tight">
                                                        {response.score !== null ? response.score : '0'}
                                                        <span className="text-brand-secondary mx-0.5 opacity-50">/</span>
                                                        <span className="text-sm opacity-80">{totalQuestions}</span>
                                                    </span>
                                                    <span className="text-[10px] text-brand-secondary uppercase font-bold tracking-tighter opacity-40">Correct Answers</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-brand-secondary text-xs">
                                                <div className="font-medium">{new Date(response.submitted_at).toLocaleDateString()}</div>
                                                <div className="opacity-60">{new Date(response.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => fetchResponseDetails(response)}
                                                    className="inline-flex items-center gap-2 bg-brand-border/10 hover:bg-brand-primary hover:text-brand-background text-brand-primary px-3 py-1.5 rounded-lg transition-all text-sm font-bold"
                                                >
                                                    <Eye size={14} /> Review
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title={`Results: ${selectedResponse?.respondent_name || ''}`}
                maxWidth="max-w-3xl"
            >
                {detailsLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <LoadingScreen fullScreen={false} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-brand-border">
                            <div>
                                <div className="text-xs text-brand-secondary uppercase font-bold tracking-widest mb-1">Final Score</div>
                                <div className="text-4xl font-black text-brand-primary">
                                    {selectedResponse?.score}
                                    <span className="text-brand-secondary/40 mx-1">/</span>
                                    <span className="text-2xl opacity-60">{quizQuestions.length}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-brand-secondary uppercase font-bold tracking-widest mb-1">Submission Date</div>
                                <div className="text-brand-primary text-sm font-medium">{new Date(selectedResponse?.submitted_at).toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                            {quizQuestions.map((q, idx) => {
                                const userAnswer = selectedResponse?.answers[q.id];
                                const isCorrect = userAnswer === q.correct_answer;

                                return (
                                    <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                        <div className="flex justify-between items-start gap-3 mb-3">
                                            <div className="flex-1">
                                                <span className="text-[10px] font-bold text-brand-secondary uppercase block mb-1">Question {idx + 1}</span>
                                                <p className="text-white font-medium">{q.text}</p>
                                            </div>
                                            {isCorrect ? (
                                                <CheckCircle className="text-green-500 shrink-0" size={20} />
                                            ) : (
                                                <XCircle className="text-red-500 shrink-0" size={20} />
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                                <span className="text-brand-secondary block mb-1 uppercase tracking-tighter text-[9px]">Respondent Answer</span>
                                                <span className={isCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                                                    {userAnswer || <span className="italic opacity-30 font-normal underline">No Answer</span>}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                                <span className="text-brand-secondary block mb-1 uppercase tracking-tighter text-[9px]">Correct Answer</span>
                                                <span className="text-green-400 font-bold">{q.correct_answer}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-4 border-t border-brand-border flex justify-end">
                            <button
                                onClick={() => setIsDetailsOpen(false)}
                                className="bg-brand-primary text-brand-background px-8 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity transform active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ResponseList;
