import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import LoadingScreen from '../../components/LoadingScreen';
import { Play, Search, Folder } from 'lucide-react';
import { logoUrl } from '../../data/site.js';

const Home = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [filteredQuizzes, setFilteredQuizzes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const { data, error } = await supabase
                    .from('quizzes')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setQuizzes(data || []);
                setFilteredQuizzes(data || []);
            } catch (err) {
                console.error('Error fetching quizzes:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    useEffect(() => {
        const results = quizzes.filter(quiz =>
            quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredQuizzes(results);
    }, [searchTerm, quizzes]);

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen p-4 flex flex-col items-center">
            <div className="text-center mt-2 mb-4 flex flex-col items-center">
                <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-24 w-24 md:h-32 md:w-32 object-contain"
                />
            </div>

            <div className="w-full max-w-sm mb-6 px-2">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-secondary group-focus-within:text-brand-primary transition-colors opacity-50" size={14} />
                    <input
                        type="text"
                        placeholder="Search quizzes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/10 border border-brand-border text-brand-primary pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-brand-primary/50 text-xs"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full max-w-6xl px-4 animate-fade-in-up pb-10">
                {filteredQuizzes.length === 0 ? (
                    <div className="col-span-full text-center py-10 bg-black/10 rounded-xl border border-brand-border/30">
                        <Folder className="mx-auto mb-2 text-brand-secondary opacity-20" size={24} />
                        <p className="text-brand-secondary text-xs opacity-50">
                            {searchTerm ? "No results found." : "No quizzes available."}
                        </p>
                    </div>
                ) : (
                    filteredQuizzes.map((quiz) => (
                        <div
                            key={quiz.id}
                            onClick={() => navigate(`/quiz/${quiz.slug || quiz.id}`)}
                            className="bg-black/10 border border-brand-border/30 p-4 rounded-xl hover:bg-black/20 transition-all duration-200 cursor-pointer flex flex-col hover:border-brand-primary/40 group"
                        >
                            <h2 className="text-sm font-bold text-white mb-1 truncate group-hover:text-brand-primary transition-colors">{quiz.title}</h2>
                            <p className="mb-4 text-brand-secondary text-[11px] line-clamp-2 opacity-60 leading-tight">
                                {quiz.description || "Start testing your knowledge."}
                            </p>

                            <div className="mt-auto pt-2 border-t border-brand-border/10 flex items-center justify-between">
                                <span className="text-[9px] font-black text-brand-secondary opacity-30 uppercase tracking-widest">QUIZ</span>
                                <div className="text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play size={12} fill="currentColor" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Home;
