import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    plan: string;
    status: string;
    hasCompletedOnboarding: boolean;
    credits: number;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    signup: (token: string, userData: User) => void;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    syncUser: () => Promise<void>;
    completeOnboarding: (credits?: number) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    const syncUser = async () => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        try {
            const userData = JSON.parse(storedUser);
            const response = await fetch(`/api/users/${userData.id}`);
            if (response.ok) {
                const freshUser = await response.json();
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
                console.log('[Auth] User synced with server:', freshUser.plan);
            }
        } catch (error) {
            console.error('[Auth] Sync failed:', error);
        }
    };

    useEffect(() => {
        // Check if token exists in localStorage on initial load
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            // Always sync once on load
            syncUser();
        }
    }, []);

    const login = (newToken: string, userData: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
    };

    const signup = (newToken: string, userData: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...userData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        }
    };

    const completeOnboarding = (credits?: number) => {
        if (user) {
            const updatedUser = {
                ...user,
                hasCompletedOnboarding: true,
                credits: credits !== undefined ? credits : user.credits
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, updateUser, syncUser, completeOnboarding, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
