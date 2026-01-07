import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import LoadingScreen from '../../components/LoadingScreen';
import { ArrowRight, CheckCircle, XCircle, RefreshCw, Layers, ClipboardList, Loader2 } from 'lucide-react';

const ModeToggle = ({ viewMode, setViewMode }) => (
    <div className="flex bg-black/30 p-0.5 rounded-lg border border-brand-border/20 w-fit mx-auto md:mx-0">
        <button
            type="button"
            onClick={() => setViewMode('step')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 text-[8px] font-black uppercase tracking-widest
                ${viewMode === 'step' ? 'bg-brand-primary text-brand-background' : 'text-brand-secondary hover:text-white'}
            `}
        >
            <Layers size={10} /> Question
        </button>
        <button
            type="button"
            onClick={() => setViewMode('single')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 text-[8px] font-black uppercase tracking-widest
                ${viewMode === 'single' ? 'bg-brand-primary text-brand-background' : 'text-brand-secondary hover:text-white'}
            `}
        >
            <ClipboardList size={10} /> All
        </button>
    </div>
);

const QuizHeader = ({ progress, viewMode, setViewMode }) => (
    <div className="w-full max-w-2xl flex flex-col items-center gap-4 mb-8">
        <ModeToggle viewMode={viewMode} setViewMode={setViewMode} />
        <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden border border-white/5">
            <div
                className="bg-brand-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    </div>
);

const QuestionItem = ({ q, index, total, answers, handleAnswer, isSinglePage, submitting, handleNext }) => {
    const currentAnswer = answers[q.id] || '';
    return (
        <div className="bg-black/20 border border-brand-border p-10 rounded-2xl shadow-card w-full flex flex-col backdrop-blur-md animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <span className="text-brand-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    Q{index + 1} / {total}
                </span>
            </div>

            <h2 className="text-2xl font-bold mb-8 text-white leading-tight">{q.text}</h2>

            <div className="space-y-3 flex-1">
                {['multiple_choice', 'true_false'].includes(q.type) ? (
                    (q.options && q.options.length > 0 ? q.options : (q.type === 'true_false' ? ['صواب', 'خطأ'] : [])).map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(q.id, option)}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between text-base
                                ${currentAnswer === option
                                    ? 'bg-brand-primary/10 border-brand-primary text-white font-bold'
                                    : 'bg-black/20 border-brand-border/20 text-brand-secondary hover:bg-white/5'
                                }
                            `}
                        >
                            <span>{option}</span>
                            {currentAnswer === option && <CheckCircle className="text-brand-primary" size={20} />}
                        </button>
                    ))
                ) : (
                    <input
                        type="text"
                        value={currentAnswer}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="w-full bg-black/30 border border-brand-border text-brand-primary p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/50 text-base"
                        placeholder="Enter your answer"
                    />
                )}
            </div>

            {!isSinglePage && (
                <div className="mt-10 pt-6 border-t border-brand-border/10 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-brand-primary text-brand-background font-black py-3 px-8 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-sm uppercase tracking-widest"
                    >
                        {index === total - 1
                            ? (submitting ? <><Loader2 className="animate-spin" size={18} /> Submitting...</> : 'Finish')
                            : 'Next'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

const QuizRunner = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState('intro');
    const [name, setName] = useState('');
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState(null);
    const [viewMode, setViewMode] = useState('step');

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                let query = supabase.from('quizzes').select('*');
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(id)) {
                    query = query.eq('id', id);
                } else {
                    query = query.eq('slug', id);
                }

                const { data: quizData, error: quizError } = await query.single();
                if (quizError) throw quizError;
                setQuiz(quizData);

                const { data: questionsData, error: questionsError } = await supabase
                    .from('questions')
                    .select('*')
                    .eq('quiz_id', quizData.id)
                    .order('order', { ascending: true });

                if (questionsError) throw questionsError;
                setQuestions(questionsData);

            } catch (err) {
                console.error('Error loading quiz:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    const handleStart = (e) => {
        e.preventDefault();
        if (name.trim()) setStep('quiz');
    };

    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            let calculatedScore = 0;
            questions.forEach(q => {
                if (answers[q.id] === q.correct_answer) {
                    calculatedScore++;
                }
            });
            setScore(calculatedScore);

            const { error } = await supabase
                .from('responses')
                .insert({
                    quiz_id: quiz.id,
                    respondent_name: name,
                    score: calculatedScore,
                    answers: answers,
                    submitted_at: new Date().toISOString()
                });

            if (error) throw error;
            setStep('result');
            window.scrollTo({ top: 0, behavior: 'instant' });
        } catch (err) {
            console.error('Error submitting quiz:', err);
            alert('Failed to submit quiz.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingScreen />;
    if (!quiz) return <div className="text-center text-white p-8">Quiz not found.</div>;

    if (step === 'intro') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-black/20 border border-brand-border p-6 rounded-xl shadow-card max-w-[280px] w-full backdrop-blur-md animate-fade-in-up">
                    <form onSubmit={handleStart} className="space-y-4">
                        <div>
                            <label className="block text-[9px] font-black text-brand-secondary mb-2 uppercase tracking-[0.2em] text-center opacity-40">NV</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full bg-black/30 border border-brand-border text-brand-primary p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 text-center text-sm font-bold"
                                placeholder=""
                            />
                        </div>
                        <button type="submit" className="w-full bg-brand-primary text-brand-background font-black text-xs py-2.5 rounded-lg hover:opacity-90">Start</button>
                    </form>
                </div>
            </div>
        );
    }

    if (step === 'quiz') {
        const progress = viewMode === 'single'
            ? (Object.keys(answers).length / questions.length) * 100
            : ((currentQuestionIndex + 1) / questions.length) * 100;

        return (
            <div className="min-h-screen flex flex-col items-center p-4 py-10">
                <QuizHeader progress={progress} viewMode={viewMode} setViewMode={setViewMode} />
                <div className="w-full max-w-2xl space-y-6">
                    {viewMode === 'single' ? (
                        <>
                            {questions.map((q, idx) => (
                                <QuestionItem
                                    key={q.id}
                                    q={q}
                                    index={idx}
                                    total={questions.length}
                                    answers={answers}
                                    handleAnswer={handleAnswer}
                                    isSinglePage={true}
                                />
                            ))}
                            <div className="pt-6 flex justify-center pb-12">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="bg-brand-primary text-brand-background font-black py-3 px-10 rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-widest shadow-glow-sm flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <><Loader2 className="animate-spin" size={18} /> Submitting...</>
                                    ) : (
                                        'Finish Quiz'
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <QuestionItem
                            q={questions[currentQuestionIndex]}
                            index={currentQuestionIndex}
                            total={questions.length}
                            answers={answers}
                            handleAnswer={handleAnswer}
                            isSinglePage={false}
                            submitting={submitting}
                            handleNext={handleNext}
                        />
                    )}
                </div>
            </div>
        );
    }

    if (step === 'result') {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="min-h-screen py-10 px-4 flex flex-col items-center">
                <div className="w-full max-w-2xl space-y-6 animate-fade-in-up">
                    <div className="bg-black/20 border border-brand-border p-12 rounded-2xl shadow-card text-center backdrop-blur-md">
                        <div className="bg-black/30 rounded-xl p-8 mb-10 border border-brand-border/50 max-w-xs mx-auto">
                            <div className="text-xs text-brand-secondary uppercase font-black tracking-[0.25em] mb-4 opacity-40">Final Score</div>
                            <div className="text-6xl font-black text-brand-primary mb-2 leading-none">{score} <span className="text-3xl opacity-10">/ {questions.length}</span></div>
                            <div className="text-brand-secondary font-bold tracking-widest text-sm opacity-60 mt-4">{percentage}% Correct</div>
                        </div>
                        <button onClick={() => navigate('/')} className="inline-flex items-center gap-3 bg-brand-primary text-brand-background font-black py-4 px-12 rounded-xl text-sm uppercase tracking-[0.2em] hover:opacity-90 transition-all"><RefreshCw size={16} /> Home</button>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xs font-black text-brand-primary px-4 uppercase tracking-[0.3em] opacity-60">Results</h2>
                        {questions.map((q, idx) => {
                            const userAnswer = answers[q.id];
                            const isCorrect = userAnswer === q.correct_answer;
                            return (
                                <div key={idx} className={`bg-black/20 border p-10 rounded-2xl backdrop-blur-md shadow-card ${isCorrect ? 'border-green-500/10' : 'border-red-500/10'}`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-brand-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Q{idx + 1} / {questions.length}</span>
                                        {isCorrect ? (
                                            <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-widest"><CheckCircle size={12} /> Correct</span>
                                        ) : (
                                            <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-widest"><XCircle size={12} /> Incorrect</span>
                                        )}
                                    </div>
                                    <p className="text-2xl font-bold text-white mb-8 leading-tight">{q.text}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-5 bg-black/30 rounded-xl border border-white/5">
                                            <span className="text-brand-secondary block text-[10px] uppercase font-black tracking-widest opacity-40 mb-3">Your Answer</span>
                                            <span className={`text-lg font-bold ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>{userAnswer || 'Not Answered'}</span>
                                        </div>
                                        {!isCorrect && (
                                            <div className="p-5 bg-green-500/5 rounded-xl border border-green-500/10">
                                                <span className="text-brand-secondary block text-[10px] uppercase font-black tracking-widest opacity-40 mb-3">Correct Answer</span>
                                                <span className="text-lg font-bold text-green-400">{q.correct_answer}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default QuizRunner;
