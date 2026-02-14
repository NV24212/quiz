import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Plus, Loader2, X, PlusCircle, ArrowUp, Link as LinkIcon, Check } from 'lucide-react';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import LoadingScreen from '../../components/LoadingScreen';
import QuizCard from './QuizCard';
import SearchableDropdown from '../../components/SearchableDropdown';
import AIPasteModal from '../../components/admin/AIPasteModal';
import { Sparkles } from 'lucide-react';

const QuizManagement = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState('');

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingQuizId, setDeletingQuizId] = useState(null);

    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    const initialFormState = {
        title: '',
        slug: '',
        description: '',
        is_active: true,
        questions: []
    };
    const [formData, setFormData] = useState(initialFormState);
    const [originalQuestionIds, setOriginalQuestionIds] = useState([]);

    const questionsEndRef = useRef(null);
    const topRef = useRef(null);

    const questionTypeOptions = [
        { value: 'multiple_choice', label: 'Multiple Choice' },
        { value: 'multiple_answer', label: 'Multiple Answer' },
        { value: 'true_false', label: 'True / False' },
        { value: 'matching', label: 'Matching (Connect)' },
        { value: 'text', label: 'Text Input' }
    ];

    const fetchQuizzes = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        try {
            const { data, error } = await supabase
                .from('quizzes')
                .select(`
                    *,
                    questions (*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const processedData = data.map(quiz => ({
                ...quiz,
                questions: (quiz.questions || [])
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map(q => ({
                        ...q,
                        options: q.options || []
                    }))
            }));

            setQuizzes(processedData);
            setError('');
        } catch (err) {
            console.error('Error fetching quizzes:', err);
            setError('Failed to load quizzes.');
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuizzes(true);
    }, [fetchQuizzes]);

    const scrollToBottom = () => {
        questionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const scrollToTop = () => {
        topRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const openModal = (quiz = null) => {
        setEditingQuiz(quiz);
        setSubmissionStatus('');
        setError('');

        if (quiz) {
            setFormData({
                ...quiz,
                slug: quiz.slug || '',
                questions: quiz.questions ? JSON.parse(JSON.stringify(quiz.questions)) : []
            });
            setOriginalQuestionIds(quiz.questions ? quiz.questions.map(q => q.id) : []);
        } else {
            setFormData(initialFormState);
            setOriginalQuestionIds([]);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingQuiz(null);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    id: null,
                    text: '',
                    type: 'multiple_choice',
                    options: ['', ''],
                    correct_answer: ''
                }
            ]
        }));
        setTimeout(scrollToBottom, 50);
    };

    const removeQuestion = (index) => {
        const newQuestions = [...formData.questions];
        newQuestions.splice(index, 1);
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };

    const updateQuestion = (index, field, value) => {
        const updatedQuestions = [...formData.questions];
        updatedQuestions[index][field] = value;

        if (field === 'type' && value === 'true_false') {
            updatedQuestions[index].options = ['True', 'False'];
        }

        setFormData({ ...formData, questions: updatedQuestions });
    };

    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...formData.questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[oIndex] = value;
        newQuestions[qIndex].options = newOptions;
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };

    const addOption = (qIndex) => {
        const newQuestions = [...formData.questions];
        newQuestions[qIndex].options.push('');
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };

    const removeOption = (qIndex, oIndex) => {
        const updatedQuestions = [...formData.questions];
        updatedQuestions[qIndex].options = updatedQuestions[qIndex].options.filter((_, i) => i !== oIndex);
        setFormData({ ...formData, questions: updatedQuestions });
    };

    const handleAIImport = (newQuestions) => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, ...newQuestions]
        }));
        setTimeout(scrollToBottom, 100);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        // Prevent double submissions if already submitting
        if (isSubmitting) return;
        setIsSubmitting(true);
        setSubmissionStatus('Saving Quiz...');

        try {
            const quizPayload = {
                title: formData.title,
                slug: formData.slug || null,
                description: formData.description,
                is_active: formData.is_active,
                updated_at: new Date().toISOString()
            };

            if (editingQuiz) quizPayload.id = editingQuiz.id;

            const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .upsert(quizPayload)
                .select()
                .single();

            if (quizError) throw quizError;
            const quizId = quizData.id;

            setSubmissionStatus('Saving Questions...');

            const currentIds = formData.questions.map(q => q.id).filter(id => id);
            const toDeleteIds = originalQuestionIds.filter(id => !currentIds.includes(id));

            if (toDeleteIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from('questions')
                    .delete()
                    .in('id', toDeleteIds);
                if (deleteError) throw deleteError;
            }

            // Prepare questions: remove empty texts and deduplicate by text+type
            const cleanedQuestions = (formData.questions || [])
                .filter(q => q && (q.text || '').toString().trim().length > 0)
                .map((q, index) => ({ ...q, __originalIndex: index }));

            const seen = new Set();
            const questionsToInsert = [];
            const questionsToUpdate = [];

            cleanedQuestions.forEach((q, idx) => {
                const key = `${(q.text || '').trim()}::${q.type}`;
                if (seen.has(key) && !q.id) {
                    // Skip inserting exact-duplicate new questions
                    return;
                }
                seen.add(key);

                const item = {
                    quiz_id: quizId,
                    text: q.text,
                    type: q.type,
                    options: ['multiple_choice', 'multiple_answer', 'matching', 'true_false'].includes(q.type) ? q.options : null,
                    correct_answer: q.correct_answer,
                    order: idx
                };

                if (q.id) {
                    item.id = q.id;
                    questionsToUpdate.push(item);
                } else {
                    questionsToInsert.push(item);
                }
            });

            if (questionsToUpdate.length > 0) {
                const { error: updateError } = await supabase
                    .from('questions')
                    .upsert(questionsToUpdate);
                if (updateError) throw updateError;
            }

            if (questionsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('questions')
                    .insert(questionsToInsert);
                if (insertError) throw insertError;
            }

            setSubmissionStatus('Completed!');
            await fetchQuizzes();
            setTimeout(() => {
                closeModal();
                setIsSubmitting(false);
            }, 500);

        } catch (err) {
            console.error('Error saving quiz:', err);
            setError('Failed to save quiz. ' + err.message);
            setSubmissionStatus('');
            setIsSubmitting(false);
        }
    };

    const openDeleteConfirm = (id) => {
        setDeletingQuizId(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingQuizId) return;
        setIsConfirmModalOpen(false);
        setQuizzes(prev => prev.filter(q => q.id !== deletingQuizId));
        try {
            const { error } = await supabase.from('quizzes').delete().eq('id', deletingQuizId);
            if (error) throw error;
        } catch (err) {
            console.error('Error deleting quiz:', err);
            setError('Failed to delete quiz.');
            fetchQuizzes();
        } finally {
            setDeletingQuizId(null);
        }
    };

    if (loading) return <LoadingScreen fullScreen={false} />;

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-brand-primary">Quiz Management</h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-brand-primary text-brand-background font-bold py-2.5 px-5 rounded-xl hover:opacity-90 transition-opacity transform active:scale-95"
                >
                    <Plus size={20} /> Create Quiz
                </button>
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError('')}><X size={18} /></button>
                </div>
            )}

            {quizzes.length === 0 ? (
                <div className="text-center py-20 text-brand-secondary">
                    <p>No quizzes found. Create one to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map(quiz => (
                        <QuizCard
                            key={quiz.id}
                            quiz={quiz}
                            onEdit={openModal}
                            onDelete={openDeleteConfirm}
                        />
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
            >
                <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div ref={topRef}></div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-brand-secondary mb-2 uppercase tracking-wider text-[10px]">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full bg-black/30 border border-brand-border text-brand-primary p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                                    placeholder="e.g., General Knowledge"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-brand-secondary mb-2 uppercase tracking-wider text-[10px]">Slug / Numeric ID</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary opacity-50">
                                        <LinkIcon size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleFormChange}
                                        className="w-full bg-black/30 border border-brand-border text-brand-primary p-3 pl-9 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                                        placeholder="e.g., 1 or math-quiz"
                                    />
                                </div>
                                <p className="text-[10px] text-brand-secondary mt-1 ml-1">Allows routing to /quiz/{formData.slug || '...'}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-brand-secondary mb-2 uppercase tracking-wider text-[10px]">Description</label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleFormChange}
                                className="w-full bg-black/30 border border-brand-border text-brand-primary p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                                rows="2"
                                placeholder="Short description..."
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleFormChange}
                                id="is_active"
                                className="h-5 w-5 bg-black/30 border-brand-border rounded text-brand-primary focus:ring-brand-primary/50 cursor-pointer"
                            />
                            <label htmlFor="is_active" className="text-brand-primary font-medium cursor-pointer">Active Dashboard</label>
                        </div>
                    </div>

                    <div className="border-t border-brand-border my-6"></div>

                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 bg-brand-background/50 backdrop-blur-sm p-4 rounded-xl border border-brand-border/30">
                            <h3 className="text-xl font-bold text-brand-primary">Questions</h3>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                {/* Top button removed per UX request */}
                                <button
                                    type="button"
                                    onClick={() => setIsAIModalOpen(true)}
                                    className="flex-1 sm:flex-none text-[10px] bg-brand-primary/10 text-brand-primary border border-brand-primary/20 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors font-bold hover:bg-brand-primary/20 uppercase tracking-wider"
                                >
                                    <Sparkles size={12} /> AI Import
                                </button>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="flex-[2] sm:flex-none text-[10px] bg-brand-primary text-brand-background py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors font-bold uppercase tracking-wider"
                                >
                                    <PlusCircle size={12} /> New Question
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 md:space-y-6">
                            {formData.questions.map((q, qIndex) => (
                                <div key={qIndex} className="bg-black/20 border border-brand-border p-4 md:p-5 rounded-2xl relative group">
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(qIndex)}
                                        className="absolute top-4 right-4 text-brand-secondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={20} />
                                    </button>

                                    <div className="grid gap-4 pr-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-brand-secondary uppercase mb-1 tracking-widest">Question {qIndex + 1}</label>
                                            <input
                                                type="text"
                                                value={q.text}
                                                onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                                required
                                                className="w-full bg-black/30 border border-brand-border text-brand-primary p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                                                placeholder="Enter question text..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-brand-secondary uppercase mb-1 tracking-widest">Type</label>
                                                <SearchableDropdown
                                                    options={questionTypeOptions}
                                                    value={q.type}
                                                    onChange={(val) => updateQuestion(qIndex, 'type', val)}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-brand-secondary uppercase mb-1 tracking-widest">Correct Answer</label>
                                                {q.type === 'text' ? (
                                                    <input
                                                        type="text"
                                                        value={q.correct_answer || ''}
                                                        onChange={(e) => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                                                        required
                                                        className="w-full bg-black/30 border border-brand-border text-brand-primary p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                                                        placeholder="Enter correct answer..."
                                                    />
                                                ) : (
                                                    <div className="flex items-center h-[42px] px-3 bg-black/10 border border-brand-border/30 rounded-xl text-brand-secondary text-xs italic">
                                                        Select an option below
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {q.type === 'true_false' && (
                                            <div className="bg-black/10 p-4 rounded-xl border border-brand-border/30">
                                                <label className="block text-xs font-bold text-brand-secondary uppercase mb-3 text-[10px]">Select Correct Answer</label>
                                                <div className="flex gap-2">
                                                    {['True', 'False'].map((opt, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => updateQuestion(qIndex, 'correct_answer', opt)}
                                                            className={`flex-1 p-3 rounded-lg border font-bold text-sm transition-all ${q.correct_answer === opt
                                                                ? 'bg-brand-primary text-brand-background border-brand-primary shadow-glow-sm'
                                                                : 'bg-black/40 border-brand-border/50 text-brand-secondary hover:border-brand-primary/50'
                                                                }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {q.type === 'matching' && (
                                            <div className="bg-black/10 p-4 rounded-xl border border-brand-border/30">
                                                <label className="block text-xs font-bold text-brand-secondary uppercase mb-3 text-[10px]">Pairs (Prompt & Choice)</label>
                                                <div className="space-y-3">
                                                    {(q.options || []).map((opt, oIndex) => {
                                                        const [prompt, answer] = opt.includes(':') ? opt.split(':') : [opt, ''];
                                                        return (
                                                            <div key={oIndex} className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-black/20 p-3 rounded-lg border border-white/5 relative">
                                                                <div className="flex-1 w-full space-y-2">
                                                                    <input
                                                                        type="text"
                                                                        value={prompt}
                                                                        onChange={(e) => {
                                                                            const newPrompt = e.target.value;
                                                                            updateOption(qIndex, oIndex, `${newPrompt}:${answer}`);
                                                                        }}
                                                                        className="w-full bg-black/30 border border-brand-border p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 text-sm text-brand-primary"
                                                                        placeholder="Prompt (e.g. Moon)"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={answer}
                                                                        onChange={(e) => {
                                                                            const newAnswer = e.target.value;
                                                                            updateOption(qIndex, oIndex, `${prompt}:${newAnswer}`);
                                                                        }}
                                                                        className="w-full bg-black/30 border border-brand-border p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 text-sm text-green-400 font-bold"
                                                                        placeholder="Correct Answer"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeOption(qIndex, oIndex)}
                                                                    className="absolute top-2 right-2 md:relative md:top-0 md:right-0 text-brand-secondary hover:text-red-500 p-2"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newOptions = [...(q.options || []), " : "];
                                                            updateQuestion(qIndex, 'options', newOptions);
                                                        }}
                                                        className="text-xs text-brand-primary hover:underline flex items-center gap-1 mt-2 font-bold"
                                                    >
                                                        <Plus size={14} /> Add Pair
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {(q.type === 'multiple_choice' || q.type === 'multiple_answer') && (
                                            <div className="bg-black/10 p-4 rounded-xl border border-brand-border/30">
                                                <label className="block text-xs font-bold text-brand-secondary uppercase mb-3 text-[10px]">
                                                    {q.type === 'multiple_answer' ? 'Options (Select all that apply)' : 'Options (Select the correct one)'}
                                                </label>
                                                <div className="space-y-2">
                                                    {(q.options || []).map((opt, oIndex) => {
                                                        const correctAnswers = q.type === 'multiple_answer'
                                                            ? (q.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean)
                                                            : [q.correct_answer];

                                                        const isCorrect = correctAnswers.includes(opt);

                                                        const toggleCorrect = () => {
                                                            if (q.type === 'multiple_choice') {
                                                                updateQuestion(qIndex, 'correct_answer', opt);
                                                            } else {
                                                                let newCorrect;
                                                                if (isCorrect) {
                                                                    newCorrect = correctAnswers.filter(a => a !== opt).join(', ');
                                                                } else {
                                                                    newCorrect = [...correctAnswers, opt].join(', ');
                                                                }
                                                                updateQuestion(qIndex, 'correct_answer', newCorrect);
                                                            }
                                                        };

                                                        return (
                                                            <div key={oIndex} className="flex gap-2 items-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={toggleCorrect}
                                                                    className={`p-2 rounded-lg border transition-all ${isCorrect
                                                                        ? 'bg-brand-primary text-brand-background border-brand-primary'
                                                                        : 'bg-black/30 border-brand-border/50 text-brand-secondary hover:border-brand-primary/50'
                                                                        }`}
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const oldVal = opt;
                                                                        const newVal = e.target.value;
                                                                        updateOption(qIndex, oIndex, newVal);

                                                                        // Update correct answer if this option was selected
                                                                        if (q.type === 'multiple_choice') {
                                                                            if (q.correct_answer === oldVal) {
                                                                                updateQuestion(qIndex, 'correct_answer', newVal);
                                                                            }
                                                                        } else {
                                                                            const updatedCorrect = correctAnswers.map(a => a === oldVal ? newVal : a).join(', ');
                                                                            updateQuestion(qIndex, 'correct_answer', updatedCorrect);
                                                                        }
                                                                    }}
                                                                    required
                                                                    className={`flex-1 bg-black/30 border p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 text-sm ${isCorrect ? 'border-brand-primary/50 text-brand-primary font-bold' : 'border-brand-border text-brand-primary'
                                                                        }`}
                                                                    placeholder={`Option ${oIndex + 1}`}
                                                                />
                                                                {q.options.length > 2 && (
                                                                    <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="text-brand-secondary hover:text-red-500">
                                                                        <X size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    <button
                                                        type="button"
                                                        onClick={() => addOption(qIndex)}
                                                        className="text-xs text-brand-primary hover:underline flex items-center gap-1 mt-2 font-bold"
                                                    >
                                                        <Plus size={14} /> Add Option
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={questionsEndRef} className="h-1" />

                            {formData.questions.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-brand-border rounded-2xl text-brand-secondary">
                                    <p>No questions added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Secondary bottom actions (non-sticky) */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t border-brand-border/30 mt-10">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="w-full sm:w-auto bg-brand-border/10 hover:bg-brand-border/20 text-brand-primary font-bold py-3 px-6 rounded-xl transition-colors text-sm uppercase tracking-widest"
                        >
                            Close Editor
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto bg-brand-primary hover:opacity-90 text-brand-background font-bold py-3 px-10 rounded-xl transition-colors flex items-center justify-center min-w-[160px] text-sm uppercase tracking-widest shadow-glow-sm"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>{editingQuiz ? 'Update Quiz' : 'Create Quiz'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            <AIPasteModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onImport={handleAIImport}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Quiz"
                message="Are you sure you want to delete this quiz? This action cannot be undone."
            />
        </div>
    );
};

export default QuizManagement;
