import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
            <div className="text-brand-secondary flex flex-col items-center text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <p className="mb-6 text-lg text-white">{message}</p>
                <div className="flex justify-center gap-4 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-brand-border/10 hover:bg-brand-border/20 text-brand-primary font-bold py-2.5 px-5 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-lg transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
