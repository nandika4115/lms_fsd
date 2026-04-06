import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';

// Admin route that checks for adminToken in localStorage
const AdminProtectedRoute = () => {
    const adminToken = localStorage.getItem('adminToken');

    // Not logged in
    if (!adminToken) {
        return <Navigate to="/admin-login" />;
    }

    // Admin is logged in, render the admin dashboard
    return <Outlet />;
};

export default AdminProtectedRoute;
