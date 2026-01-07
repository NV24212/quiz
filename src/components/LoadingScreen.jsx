import React from 'react';
import { logoUrl } from '../data/site';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ fullScreen = true }) => {
    const wrapperClasses = fullScreen
        ? 'fixed inset-0 flex items-center justify-center bg-brand-background z-50'
        : 'flex items-center justify-center py-20';

    return (
        <div className={wrapperClasses}>
            <div className="flex flex-col items-center gap-4">
                <img
                    src={logoUrl}
                    alt="Loading..."
                    className="h-10 w-10 object-contain animate-pulse"
                />
                <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
            </div>
        </div>
    );
};

export default LoadingScreen;
