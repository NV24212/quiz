import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

const ProtectedRoute = () => {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return <LoadingScreen fullScreen={true} />;
    }

    if (!user) {
        return <Navigate to="/manage/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
