import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { logoUrl } from '../data/site';
import { Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import SearchableDropdown from '../components/SearchableDropdown';

const Login = () => {
    const [accounts, setAccounts] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingAccounts, setFetchingAccounts] = useState(true);
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        // We'll keep the selected email as a controlled input if needed, 
        // but no longer fetching from the database.
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(selectedEmail, password);
            navigate('/manage');
        } catch (err) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-background p-4">
            <div className="w-full max-w-md bg-brand-background/50 border border-brand-border p-8 rounded-20 shadow-card backdrop-blur-sm animate-modal-in">
                <div className="flex justify-center mb-6">
                    <img
                        src={logoUrl}
                        alt="Logo"
                        className="w-32 h-32 object-contain"
                    />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-brand-secondary text-sm font-bold mb-2">Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full bg-black/30 border border-brand-border text-brand-primary p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            value={selectedEmail}
                            onChange={(e) => setSelectedEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-brand-secondary text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            className="w-full bg-black/30 border border-brand-border text-brand-primary p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (!selectedEmail && accounts.length === 0)}
                        className="w-full bg-brand-primary text-brand-background font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center mt-6"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
