import React, { useState, useRef, useEffect } from 'react';
import { Check, Search, ChevronDown, X } from 'lucide-react';

const SearchableDropdown = ({
    options = [],
    value,
    onChange,
    placeholder = "Select an option",
    searchPlaceholder = "Search...",
    noResultsText = "No results found",
    labelField = "label",
    valueField = "value",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option => {
        const label = typeof option === 'string' ? option : option[labelField];
        return label.toLowerCase().includes(search.toLowerCase());
    });

    const selectedOption = options.find(option => {
        const val = typeof option === 'string' ? option : option[valueField];
        return val === value;
    });

    const displayLabel = selectedOption
        ? (typeof selectedOption === 'string' ? selectedOption : selectedOption[labelField])
        : placeholder;

    const handleSelect = (option) => {
        const val = typeof option === 'string' ? option : option[valueField];
        onChange(val);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 bg-black/30 border border-brand-border text-brand-primary p-3.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/50 transition-all text-left active:scale-[0.98]"
            >
                <span className={`truncate ${!selectedOption ? "text-brand-secondary opacity-60" : "text-brand-primary font-medium"}`}>
                    {displayLabel}
                </span>
                <ChevronDown className={`text-brand-secondary shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={18} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-brand-background border border-brand-border rounded-xl shadow-2xl overflow-hidden animate-fade-in-up duration-200">
                    <div className="p-2 border-b border-brand-border/50 bg-black/20 flex items-center gap-2">
                        <Search className="text-brand-secondary" size={16} />
                        <input
                            type="text"
                            className="w-full bg-transparent border-none text-brand-primary text-sm focus:outline-none placeholder:text-brand-secondary/50"
                            placeholder={searchPlaceholder}
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="text-brand-secondary hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-sm text-brand-secondary">
                                {noResultsText}
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => {
                                const label = typeof option === 'string' ? option : option[labelField];
                                const val = typeof option === 'string' ? option : option[valueField];
                                const isSelected = val === value;

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className={`w-full flex items-center justify-between p-4 text-sm text-left transition-colors border-b border-white/5 last:border-0 ${isSelected ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-secondary hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <span>{label}</span>
                                        {isSelected && <Check size={16} className="text-brand-primary" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
