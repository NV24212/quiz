import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { X, Home, LogOut } from 'lucide-react';
import { logoUrl } from '../data/site.js';

const MobileAdminSidebar = ({ isOpen, onClose, user, navLinks, handleLogout }) => {
    const handleLinkClick = () => {
        onClose();
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-black/50 backdrop-blur-lg border-r border-brand-border z-50 transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ willChange: 'transform' }}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 mb-4 border-b border-brand-border/50">
                        <div className="flex items-center gap-3">
                            <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
                            <span className="text-lg font-bold text-white whitespace-nowrap">{user?.email?.split('@')[0] || 'Admin'}</span>
                        </div>
                        <button onClick={onClose} className="text-brand-secondary hover:text-brand-primary">
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="flex-grow px-2">
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/"
                                    className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-brand-secondary hover:bg-brand-primary/5 hover:text-brand-primary"
                                    onClick={handleLinkClick}
                                >
                                    <Home className="h-5 w-5 mr-3" />
                                    <span>Home</span>
                                </Link>
                            </li>
                            {navLinks.map((link) => (
                                <li key={link.to}>
                                    <NavLink
                                        to={link.to}
                                        className={({ isActive }) =>
                                            `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-secondary hover:bg-brand-primary/5 hover:text-brand-primary'
                                            }`
                                        }
                                        onClick={handleLinkClick}
                                    >
                                        <link.icon className="h-5 w-5 mr-3" />
                                        <span>{link.text}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="px-2 py-4 mt-auto">
                        <div className="border-t border-brand-border pt-4">
                            <button
                                onClick={() => {
                                    handleLinkClick();
                                    handleLogout();
                                }}
                                className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-brand-secondary hover:bg-brand-primary/5 hover:text-brand-primary rounded-lg transition-colors duration-200"
                            >
                                <LogOut className="h-5 w-5 mr-3" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default MobileAdminSidebar;
