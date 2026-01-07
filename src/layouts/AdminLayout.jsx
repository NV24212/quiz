import React, { useState, useEffect, useContext } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Users, PanelLeft, Menu, Home, LogOut, FileText } from 'lucide-react';
import { AuthContext } from '../context/AuthContext.jsx';
import MobileAdminSidebar from './MobileAdminSidebar.jsx';
import { logoUrl } from '../data/site.js';

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = isMobileSidebarOpen ? 'hidden' : 'unset';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileSidebarOpen]);

    const handleLogout = () => {
        logout();
        navigate('/manage/login');
    };

    const navLinks = [
        { to: '/manage', text: 'Quizzes', icon: FileText, show: true },
        { to: '/manage/responses', text: 'Responses', icon: Users, show: true },
    ].filter(link => link.show);

    const getNavLinkClasses = (isOpen) => (to) => {
        const isStrictActive = to === '/manage' ? location.pathname === '/manage' : location.pathname.startsWith(to);

        return `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isStrictActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-secondary hover:bg-brand-primary/5 hover:text-brand-primary'
            } ${!isOpen ? 'justify-center' : ''}`;
    };

    const getHomeLinkClasses = (isOpen) => `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-brand-secondary hover:bg-brand-primary/5 hover:text-brand-primary ${!isOpen ? 'justify-center' : ''}`;

    const DesktopSidebarContent = () => {
        const isOpen = isDesktopSidebarOpen;

        return (
            <div className="flex flex-col h-full">
                <div className={`flex items-center justify-between p-4 mb-4 border-b border-brand-border/50`}>
                    <div className={`flex items-center gap-3 transition-all duration-300 ${!isOpen ? 'opacity-0 w-0 h-0 hidden' : 'opacity-100'}`}>
                        <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
                        <span className="text-lg font-bold text-white whitespace-nowrap">{user?.email?.split('@')[0] || 'Admin'}</span>
                    </div>
                </div>

                <nav className="flex-grow px-2">
                    <ul className="space-y-2">
                        <li>
                            <Link to="/" className={getHomeLinkClasses(isOpen)} title={isOpen ? '' : 'Home'}>
                                <Home className={`h-5 w-5 ${isOpen ? 'mr-3' : ''}`} />
                                <span className={`transition-opacity duration-200 whitespace-nowrap ${!isOpen ? 'hidden' : 'delay-200'}`}>Public Home</span>
                            </Link>
                        </li>
                        {navLinks.map((link) => (
                            <li key={link.to}>
                                <NavLink to={link.to} className={getNavLinkClasses(isOpen)(link.to)} title={isOpen ? '' : link.text}>
                                    <link.icon className={`h-5 w-5 ${isOpen ? 'mr-3' : ''}`} />
                                    <span className={`transition-opacity duration-200 whitespace-nowrap ${!isOpen ? 'hidden' : 'delay-200'}`}>{link.text}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="px-2 py-4 mt-auto">
                    <div className="border-t border-brand-border pt-4 space-y-2">
                        <button onClick={() => setIsDesktopSidebarOpen(!isOpen)} className={`flex items-center w-full px-4 py-2.5 text-sm font-medium text-brand-secondary hover:bg-brand-primary/5 hover:text-brand-primary rounded-lg transition-colors duration-200 ${!isOpen ? 'justify-center' : ''}`}>
                            <PanelLeft className={`h-5 w-5 ${isOpen ? 'mr-3' : ''}`} />
                            <span className={`transition-opacity duration-200 whitespace-nowrap ${!isOpen ? 'hidden' : 'delay-200'}`}>{isOpen ? 'Collapse' : ''}</span>
                        </button>
                        <button onClick={handleLogout} className={`flex items-center w-full px-4 py-2.5 text-sm font-medium text-brand-secondary hover:bg-brand-primary/5 hover:text-brand-primary rounded-lg transition-colors duration-200 ${!isOpen ? 'justify-center' : ''}`}>
                            <LogOut className={`h-5 w-5 ${isOpen ? 'mr-3' : ''}`} />
                            <span className={`transition-opacity duration-200 whitespace-nowrap ${!isOpen ? 'hidden' : 'delay-200'}`}>{isOpen ? 'Logout' : ''}</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-brand-background text-brand-primary font-sans">
            <MobileAdminSidebar
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
                user={user}
                navLinks={navLinks}
                handleLogout={handleLogout}
            />

            <aside className={`hidden md:flex md:flex-shrink-0 bg-black/20 border-r border-brand-border transition-all duration-300 ${isDesktopSidebarOpen ? 'w-64' : 'w-20'}`}>
                <DesktopSidebarContent />
            </aside>

            <div className="flex flex-col flex-1 min-w-0">
                <header className="sticky top-0 bg-brand-background/80 backdrop-blur-lg border-b border-brand-border p-4 flex items-center md:hidden z-30">
                    <button onClick={() => setIsMobileSidebarOpen(true)} className="text-brand-primary">
                        <Menu size={24} />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in-up">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
