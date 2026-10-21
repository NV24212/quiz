import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import LoadingScreen from '../../components/LoadingScreen';
import { ArrowRight, CheckCircle, XCircle, RefreshCw, ClipboardList, Loader2, BookOpen, Award } from 'lucide-react';

const QuizHeader = ({ progress }) => (
    <div className="w-full max-w-2xl flex flex-col items-center gap-4 mb-8">
        <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden border border-white/5">
            <div
                className="bg-brand-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    </div>
);

const QuestionItem = ({ q, index, total, answers, handleAnswer, submitting, handleNext, mode }) => {
    if (!q) return null;
    const currentAnswer = answers[q.id] || '';
    const isPractice = mode === 'practice';

    return (
        <div className="bg-black/20 border border-brand-border p-5 md:p-10 rounded-2xl shadow-card w-full flex flex-col backdrop-blur-md animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <span className="text-brand-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    Q{index + 1} / {total}
                </span>
                {isPractice && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full uppercase tracking-wider">
                        Practice Mode
                    </span>
                )}
            </div>

            <h2 dir="auto" className="text-2xl font-bold mb-8 text-white leading-tight">{q.text}</h2>

            <div className="space-y-3 flex-1">
                {q.type === 'matching' ? (
                    <div className="space-y-4">
                        {(q.options || []).map((opt, oIdx) => {
                            const [prompt, correctAnswer] = opt.includes(':') ? opt.split(':') : [opt, ''];
                            const allChoices = Array.from(new Set((q.options || []).map(o => o.includes(':') ? o.split(':')[1] : o)));
                            const currentMatches = answers[q.id] || {};
                            const userChoice = currentMatches[prompt] || '';
                            const isMatchCorrect = userChoice === correctAnswer;
                            const hasChosen = Boolean(userChoice);

                            return (
                                <div key={oIdx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-black/10 rounded-xl border border-brand-border/10">
                                    <span dir="auto" className="text-sm font-medium text-white px-2 py-1 bg-white/5 rounded-lg flex-1">{prompt}</span>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <select
                                            value={userChoice}
                                            onChange={(e) => {
                                                const newMatches = { ...currentMatches, [prompt]: e.target.value };
                                                handleAnswer(q.id, newMatches);
                                            }}
                                            className={`w-full sm:w-48 bg-black/40 border text-brand-primary p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 text-xs ${
                                                isPractice && hasChosen
                                                    ? (isMatchCorrect ? 'border-green-500 text-green-400 font-bold' : 'border-red-500 text-red-400')
                                                    : 'border-brand-border'
                                            }`}
                                        >
                                            <option value="">[ Choose ]</option>
                                            {allChoices.map((choice, cIdx) => (
                                                <option key={cIdx} value={choice}>{choice}</option>
                                            ))}
                                        </select>
                                        {isPractice && hasChosen && (
                                            isMatchCorrect
                                                ? <CheckCircle className="text-green-400 shrink-0" size={18} />
                                                : <XCircle className="text-red-400 shrink-0" size={18} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : ['multiple_choice', 'multiple_answer', 'true_false'].includes(q.type) ? (
                    (q.options && q.options.length > 0 ? q.options : (q.type === 'true_false' ? ['True', 'False'] : [])).map((option, idx) => {
                        const isMultiple = q.type === 'multiple_answer';
                        const currentAnswers = isMultiple
                            ? (currentAnswer || '').split(',').map(s => s.trim()).filter(Boolean)
                            : [currentAnswer];

                        const isSelected = currentAnswers.includes(option);

                        // Correct answer check for Practice Mode
                        const correctAnswers = isMultiple
                            ? (q.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean)
                            : [q.correct_answer];
                        const isOptionCorrect = correctAnswers.includes(option);

                        const toggleAnswer = () => {
                            if (!isMultiple) {
                                handleAnswer(q.id, option);
                            } else {
                                let newAnswers;
                                if (isSelected) {
                                    newAnswers = currentAnswers.filter(a => a !== option);
                                } else {
                                    newAnswers = [...currentAnswers, option];
                                }
                                handleAnswer(q.id, newAnswers.join(', '));
                            }
                        };

                        let buttonStyles = "bg-black/20 border-brand-border/20 text-brand-secondary hover:bg-white/10 hover:border-brand-border/40 hover:text-white";

                        if (isPractice) {
                            if (isSelected) {
                                if (isOptionCorrect) {
                                    buttonStyles = "bg-green-500/20 border-green-500 text-green-300 font-bold hover:bg-green-500/30";
                                } else {
                                    buttonStyles = "bg-red-500/20 border-red-500 text-red-300 font-bold hover:bg-red-500/30";
                                }
                            } else if (isOptionCorrect && Boolean(currentAnswer)) {
                                buttonStyles = "bg-green-500/10 border-green-500/50 text-green-400 font-bold hover:bg-green-500/20";
                            }
                        } else {
                            if (isSelected) {
                                buttonStyles = "bg-brand-primary/10 border-brand-primary text-white font-bold hover:bg-brand-primary/20";
                            }
                        }

                        return (
                            <button
                                key={idx}
                                onClick={toggleAnswer}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ease-in-out transform active:scale-[0.99] flex items-center justify-between text-base ${buttonStyles}`}
                            >
                                <span dir="auto">{option}</span>
                                {isPractice ? (
                                    isSelected ? (
                                        isOptionCorrect ? <CheckCircle className="text-green-400" size={20} /> : <XCircle className="text-red-400" size={20} />
                                    ) : (isOptionCorrect && Boolean(currentAnswer) && <CheckCircle className="text-green-400 opacity-60" size={20} />)
                                ) : (
                                    isSelected && <CheckCircle className="text-brand-primary" size={20} />
                                )}
                            </button>
                        );
                    })
                ) : (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={currentAnswer}
                            onChange={(e) => handleAnswer(q.id, e.target.value)}
                            className={`w-full bg-black/30 border text-brand-primary p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/50 text-base ${
                                isPractice && currentAnswer
                                    ? (currentAnswer.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase()
                                        ? 'border-green-500 text-green-400 font-bold'
                                        : 'border-red-500 text-red-400')
                                    : 'border-brand-border'
                            }`}
                            placeholder="Enter your answer"
                            dir="auto"
                        />
                        {isPractice && currentAnswer && (
                            <p className="text-xs text-brand-secondary mt-1">
                                Correct Answer: <span className="text-green-400 font-bold">{q.correct_answer}</span>
                            </p>
                        )}
                    </div>
                )}
            </div>

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
        </div>
    );
};

const QuizRunner = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState('intro');
    const [name, setName] = useState('');
    const [mode, setMode] = useState('exam'); // 'exam' or 'practice'
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState(null);

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
                const userVal = answers[q.id];
                const correctVal = q.correct_answer;

                if (q.type === 'matching') {
                    const expectedMatches = {};
                    (q.options || []).forEach(opt => {
                        const [p, a] = opt.includes(':') ? opt.split(':') : [opt, ''];
                        expectedMatches[p] = a;
                    });

                    const userMatches = typeof userVal === 'object' ? userVal : {};
                    const isAllCorrect = Object.keys(expectedMatches).every(p => userMatches[p] === expectedMatches[p]);
                    if (isAllCorrect && Object.keys(expectedMatches).length > 0) {
                        calculatedScore++;
                    }
                } else if (q.type === 'multiple_answer') {
                    const userAnswers = (userVal || '').split(',').map(s => s.trim()).filter(Boolean).sort();
                    const correctAnswers = (correctVal || '').split(',').map(s => s.trim()).filter(Boolean).sort();

                    if (userAnswers.length > 0 && userAnswers.length === correctAnswers.length && userAnswers.every((val, index) => val === correctAnswers[index])) {
                        calculatedScore++;
                    }
                } else if (userVal === correctVal) {
                    calculatedScore++;
                }
            });
            setScore(calculatedScore);

            // Only save responses in Exam Mode (do NOT save in Practice Mode)
            if (mode === 'exam') {
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
            }

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
                <div className="bg-black/20 border border-brand-border p-6 rounded-xl shadow-card max-w-xs w-full backdrop-blur-md animate-fade-in-up">
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

                        <div>
                            <label className="block text-[9px] font-black text-brand-secondary mb-2 uppercase tracking-[0.2em] text-center opacity-40">Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMode('exam')}
                                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-bold transition-all ${
                                        mode === 'exam'
                                            ? 'bg-brand-primary text-brand-background border-brand-primary'
                                            : 'bg-black/20 border-brand-border/30 text-brand-secondary hover:text-white'
                                    }`}
                                >
                                    <Award size={14} /> Exam
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('practice')}
                                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-bold transition-all ${
                                        mode === 'practice'
                                            ? 'bg-brand-primary text-brand-background border-brand-primary'
                                            : 'bg-black/20 border-brand-border/30 text-brand-secondary hover:text-white'
                                    }`}
                                >
                                    <BookOpen size={14} /> Practice
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-brand-primary text-brand-background font-black text-xs py-2.5 rounded-lg hover:opacity-90 mt-2">Start</button>
                    </form>
                </div>
            </div>
        );
    }

    if (step === 'quiz') {
        if (questions.length === 0) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4">
                    <div className="bg-black/20 border border-brand-border p-10 rounded-2xl shadow-card text-center backdrop-blur-md max-w-md w-full">
                        <div className="bg-orange-500/10 text-orange-400 p-4 rounded-xl border border-orange-500/20 mb-6">
                            <ClipboardList className="mx-auto mb-2" size={32} />
                            <p className="font-bold">No questions available</p>
                            <p className="text-xs opacity-70 mt-1">This quiz doesn't have any questions yet. Please check back later.</p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-brand-primary text-brand-background font-black py-3 px-10 rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-widest shadow-glow-sm"
                        >
                            Return Home
                        </button>
                    </div>
                </div>
            );
        }

        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

        return (
            <div className="min-h-screen flex flex-col items-center p-4 py-10">
                <QuizHeader progress={progress} />
                <div className="w-full max-w-2xl space-y-6">
                    <QuestionItem
                        q={questions[currentQuestionIndex]}
                        index={currentQuestionIndex}
                        total={questions.length}
                        answers={answers}
                        handleAnswer={handleAnswer}
                        submitting={submitting}
                        handleNext={handleNext}
                        mode={mode}
                    />
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
                        {mode === 'practice' && (
                            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
                                Practice Mode (Results not saved)
                            </p>
                        )}
                        <div className="bg-black/30 rounded-xl p-8 mb-10 border border-brand-border/50 max-w-xs mx-auto">
                            <div className="text-xs text-brand-secondary uppercase font-black tracking-[0.25em] mb-4 opacity-40">Final Score</div>
                            <div className="text-6xl font-black text-brand-primary mb-2 leading-none">{score} <span className="text-3xl opacity-10">/ {questions.length}</span></div>
                            <div className="text-brand-secondary font-bold tracking-widest text-sm opacity-60 mt-4">{percentage}% Correct</div>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => {
                                setAnswers({});
                                setCurrentQuestionIndex(0);
                                setScore(null);
                                setStep('quiz');
                                window.scrollTo({ top: 0, behavior: 'instant' });
                            }} className="inline-flex items-center gap-3 bg-brand-primary/80 text-brand-background font-black py-4 px-6 rounded-xl text-sm uppercase tracking-[0.2em] hover:opacity-90 transition-all"><RefreshCw size={16} /> Practice Again</button>
                            <button onClick={() => navigate('/')} className="inline-flex items-center gap-3 bg-brand-primary text-brand-background font-black py-4 px-12 rounded-xl text-sm uppercase tracking-[0.2em] hover:opacity-90 transition-all"><RefreshCw size={16} /> Home</button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xs font-black text-brand-primary px-4 uppercase tracking-[0.3em] opacity-60">Results</h2>
                        {questions.map((q, idx) => {
                            const userAnswer = answers[q.id];
                            let isCorrect = userAnswer === q.correct_answer;

                            if (q.type === 'matching') {
                                const expected = {};
                                (q.options || []).forEach(opt => {
                                    const [p, a] = opt.includes(':') ? opt.split(':') : [opt, ''];
                                    expected[p] = a;
                                });
                                const userMatches = typeof userAnswer === 'object' ? userAnswer : {};
                                isCorrect = Object.keys(expected).length > 0 && Object.keys(expected).every(p => userMatches[p] === expected[p]);
                            } else if (q.type === 'multiple_answer') {
                                const userAnswers = (userAnswer || '').split(',').map(s => s.trim()).filter(Boolean).sort();
                                const correctAnswers = (q.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean).sort();
                                isCorrect = userAnswers.length > 0 && userAnswers.length === correctAnswers.length && userAnswers.every((val, idx) => val === correctAnswers[idx]);
                            }

                            return (
                                <div key={idx} className={`bg-black/20 border p-6 md:p-10 rounded-2xl backdrop-blur-md shadow-card ${isCorrect ? 'border-green-500/10' : 'border-red-500/10'}`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-brand-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Q{idx + 1} / {questions.length}</span>
                                        {isCorrect ? (
                                            <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-widest"><CheckCircle size={12} /> Correct</span>
                                        ) : (
                                            <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-widest"><XCircle size={12} /> Incorrect</span>
                                        )}
                                    </div>
                                    <p dir="auto" className="text-xl md:text-2xl font-bold text-white mb-8 leading-tight">{q.text}</p>

                                    {q.type === 'matching' ? (
                                        <div className="space-y-2 bg-black/30 p-4 rounded-xl border border-white/5">
                                            {(q.options || []).map((opt, i) => {
                                                const [p, a] = opt.includes(':') ? opt.split(':') : [opt, ''];
                                                const uA = (userAnswer || {})[p];
                                                const matchOk = uA === a;
                                                return (
                                                    <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                        <span dir="auto" className="text-brand-secondary">{p}</span>
                                                        <div className="flex items-center gap-2 font-bold">
                                                            <span dir="auto" className={matchOk ? "text-green-400" : "text-red-400"}>{uA || '---'}</span>
                                                            {!matchOk && <span dir="auto" className="text-brand-secondary opacity-40">({a})</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-5 bg-black/30 rounded-xl border border-white/5">
                                                <span className="text-brand-secondary block text-[10px] uppercase font-black tracking-widest opacity-40 mb-3">Your Answer</span>
                                                <span dir="auto" className={`text-lg font-bold ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>{userAnswer || 'Not Answered'}</span>
                                            </div>
                                            {!isCorrect && (
                                                <div className="p-5 bg-green-500/5 rounded-xl border border-green-500/10">
                                                    <span className="text-brand-secondary block text-[10px] uppercase font-black tracking-widest opacity-40 mb-3">Correct Answer</span>
                                                    <span dir="auto" className="text-lg font-bold text-green-400">{q.correct_answer}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
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
