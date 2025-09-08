import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Container, Alert } from 'react-bootstrap';

// This component checks if a user is logged in and has the required role
const ProtectedRoute = ({ requiredRole }) => {
  const { user } = useContext(AuthContext);

  // Case 1: User is not logged in
  if (!user) {
    // Redirect them to the login page
    return <Navigate to="/login" />;
  }

  // Case 2: User is logged in but does not have the required role
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

  // Case 3: User is logged in and has the correct role
  // The <Outlet /> component renders the actual page (e.g., CreateCoursePage)
  return <Outlet />;
};

export default ProtectedRoute;