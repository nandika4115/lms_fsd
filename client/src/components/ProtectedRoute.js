import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Container, Spinner, Alert } from 'react-bootstrap';

// This component now waits for the initial auth check to complete
const ProtectedRoute = ({ requiredRole }) => {
    // Get both the user and the new isAuthLoading state from the context
    const { user, isAuthLoading } = useContext(AuthContext);

    // --- THIS IS THE NEW LOGIC ---
    // While the context is checking for a token, show a loading spinner.
    // This prevents the premature redirect to /login on page refresh.
    if (isAuthLoading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }
    // --- END OF NEW LOGIC ---

    // Case 1: After loading, if there is still no user, redirect to login.
    if (!user) {
        return <Navigate to="/login" />;
    }

    // Case 2: User is logged in but does not have the required role.
    if (user.role !== requiredRole) {
        return (
            <Container className="my-5 text-center">
                <Alert variant="danger">
                    <Alert.Heading>Access Denied</Alert.Heading>
                    <p>You do not have permission to view this page.</p>
                </Alert>
            </Container>
        );
    }

    // Case 3: User is authenticated and authorized. Render the requested page.
    return <Outlet />;
};

export default ProtectedRoute;


