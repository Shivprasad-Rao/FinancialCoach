import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { JSX } from 'react';

export function PublicRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div></div>; // Or spinner
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
}
