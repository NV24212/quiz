import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-3xl', headerActions }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex justify-center items-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className={`bg-brand-background border border-brand-border rounded-t-2xl md:rounded-2xl shadow-card w-full ${maxWidth} mt-auto md:m-auto flex flex-col max-h-[92vh] md:max-h-[90vh] animate-modal-in`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-shrink-0 flex justify-between items-center p-4 md:p-6 border-b border-brand-border">
                    <h2 className="text-xl font-bold text-white truncate pr-4">{title}</h2>
                    <div className="flex items-center gap-3">
                        {headerActions}
                        <button
                            onClick={onClose}
                            className="text-brand-secondary hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="p-4 md:p-6 overflow-y-auto flex-grow text-white">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
