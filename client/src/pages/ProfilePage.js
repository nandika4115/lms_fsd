import React, { useContext, useState, useEffect } from 'react';
import { Container, Card, ListGroup, Alert, Button, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

function ProfilePage() {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only fetch data if the user is logged in
    if (user) {
      const fetchProfile = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProfileData(response.data);
          setError('');
        } catch (err) {
          console.error("Failed to fetch profile data:", err);
          setError("Could not load your profile details.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else {
      setLoading(false); // If no user, stop loading
    }
  }, [user]); // Re-run the effect if the user object changes

  // If the user is not logged in
  if (!user) {
    return (
      <Container className="my-5 text-center">
        <Row className="justify-content-center">
          <Col md={6}>
            <Alert variant="warning">
              <Alert.Heading>Access Denied</Alert.Heading>
              <p>You must be logged in to view your profile page.</p>
            </Alert>
            <Button as={Link} to="/login" variant="primary">Go to Login</Button>
          </Col>
        </Row>
      </Container>
    );
  }

  // Loading state while fetching data
  if (loading) {
    return (
        <Container className="my-5 text-center">
            <Spinner animation="border" />
            <p className="mt-2">Loading Profile...</p>
        </Container>
    );
  }

  // Error state if data fetch fails
  if (error) {
    return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  // Main component render with all profile data
  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <h1 className="text-center mb-4">My Profile</h1>
          {profileData && (
            <Card>
              <Card.Header as="h5">Welcome, {profileData.first_name}!</Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>Full Name:</strong> {profileData.first_name} {profileData.last_name}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Username:</strong> {profileData.username}
                  </ListGroup.Item>
                   <ListGroup.Item>
                    <strong>Email:</strong> {profileData.email}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Account Role:</strong> <span className="text-capitalize">{profileData.role}</span>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Phone Number:</strong> {profileData.phone_number || 'Not provided'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Age:</strong> {profileData.age || 'Not provided'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Current Activity:</strong> {profileData.current_activity || 'Not provided'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Institution/Company:</strong> {profileData.activity_place || 'Not provided'}
                  </ListGroup.Item>
                   <ListGroup.Item>
                    <strong>Member Since:</strong> {new Date(profileData.created_at).toLocaleDateString()}
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;

