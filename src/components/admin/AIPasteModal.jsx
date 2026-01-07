import React, { useState } from 'react';
import Modal from '../Modal';
import { parseQuestionsWithAI } from '../../services/gemini';
import { Sparkles, Loader2, Check, AlertCircle, Trash2 } from 'lucide-react';

const AIPasteModal = ({ isOpen, onClose, onImport }) => {
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedData, setParsedData] = useState(null);

    const handleProcess = async () => {
        if (!rawText.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const result = await parseQuestionsWithAI(rawText);
            setParsedData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmImport = () => {
        const finalizedData = parsedData.map(q => {
            if (q.type === 'true_false' && (!q.options || q.options.length === 0)) {
                return { ...q, options: ['صواب', 'خطأ'] };
            }
            return q;
        });
        onImport(finalizedData);
        handleClose();
    };

    const handleClose = () => {
        setRawText('');
        setParsedData(null);
        setError(null);
        onClose();
    };

    const deleteParsedItem = (index) => {
        setParsedData(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="AI Question Importer"
            maxWidth="max-w-4xl"
        >
            {!parsedData ? (
                <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-sm text-blue-200 mb-4">
                        <Sparkles className="flex-shrink-0" size={18} />
                        <p>Paste your raw text (e.g. from Canvas, Google Forms, or a PDF) below. Gemini will automatically extract the questions, choices, and correct answers.</p>
                    </div>

                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Paste your text here..."
                        className="w-full h-64 bg-black/30 border border-brand-border rounded-xl p-4 focus:ring-1 focus:ring-brand-primary outline-none transition-all resize-none text-sm font-medium"
                    />

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleProcess}
                            disabled={loading || !rawText.trim()}
                            className="bg-brand-primary text-brand-background font-black py-2.5 px-6 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin" size={16} /> Analyzing...</>
                            ) : (
                                <><Sparkles size={16} /> Process with AI</>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-brand-secondary uppercase tracking-widest">Review Extracted Questions ({parsedData.length})</h3>
                        <button
                            onClick={() => setParsedData(null)}
                            className="text-[10px] text-brand-secondary hover:text-white uppercase font-black"
                        >
                            ← Back to text
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        {parsedData.map((q, idx) => (
                            <div key={idx} className="bg-black/20 border border-brand-border/50 p-4 rounded-xl relative group">
                                <button
                                    onClick={() => deleteParsedItem(idx)}
                                    className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-400/10 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <span className="text-[10px] font-black text-brand-secondary block mb-2 uppercase opacity-40">Question {idx + 1}</span>
                                <p className="font-bold text-sm mb-3 pr-8 leading-relaxed">{q.text}</p>

                                {['multiple_choice', 'true_false'].includes(q.type) && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {(q.options && q.options.length > 0 ? q.options : (q.type === 'true_false' ? ['صواب', 'خطأ'] : [])).map((opt, i) => (
                                            <div key={i} className={`text-[11px] p-2 rounded-lg border ${q.correct_answer === opt ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-white/5 bg-white/5 opacity-60'}`}>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'matching' && (
                                    <div className="space-y-2">
                                        {(q.options || []).map((pair, i) => (
                                            <div key={i} className="flex justify-between items-center text-[11px] p-2 rounded-lg border border-white/5 bg-white/5">
                                                <span>{pair.split(':')[0]}</span>
                                                <span className="text-green-400 font-bold">{pair.split(':')[1]}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'text' && (
                                    <div className="text-[11px] p-2 rounded-lg border border-brand-primary/20 bg-brand-primary/5 text-brand-primary italic">
                                        Answer: {q.correct_answer || 'Manual check needed'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                        <button
                            onClick={handleClose}
                            className="text-brand-secondary font-bold text-xs px-6 py-2.5 hover:text-white transition-all uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmImport}
                            className="bg-brand-primary text-brand-background font-black py-2.5 px-8 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                        >
                            <Check size={16} /> Add to Quiz
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AIPasteModal;
