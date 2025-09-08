import React, { useContext, useState, useEffect } from 'react';
import { Container, Card, ListGroup, Alert, Button, Row, Col, Spinner, Form } from 'react-bootstrap';
// ✨ 'Link' has been removed from this import statement
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

function ProfilePage() {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // New state to toggle between viewing and editing modes
  const [isEditing, setIsEditing] = useState(false);
  // New state to hold form data while editing
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProfileData(response.data);
          setFormData(response.data); // Pre-fill the form data
        } catch (err) {
          setError("Could not load your profile details.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
        `${API_URL}/api/profile`,
        { // Send only the updatable fields
          firstName: formData.first_name,
          lastName: formData.last_name,
          phoneNumber: formData.phone_number,
          age: formData.age,
          currentActivity: formData.current_activity,
          activityPlace: formData.activity_place
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(response.data.message);
      setProfileData(formData); // Update the view with the new data
      setIsEditing(false); // Switch back to view mode
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    }
  };

  if (!user) {
    return (
      <Container className="my-5 text-center">
        <Alert variant="warning">You must be logged in to view your profile.</Alert>
      </Container>
    );
  }

  if (loading) {
    return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
  }

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <h1 className="text-center mb-4">My Profile</h1>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Card>
            <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
              Welcome, {profileData?.first_name}!
              <Button variant="outline-secondary" size="sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Card.Header>
            <Card.Body>
              {isEditing ? (
                // --- EDITING FORM ---
                <Form onSubmit={handleUpdateProfile}>
                  <Row>
                    <Col md={6}><Form.Group className="mb-3"><Form.Label>First Name</Form.Label><Form.Control type="text" name="first_name" value={formData.first_name || ''} onChange={handleFormChange} required /></Form.Group></Col>
                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Last Name</Form.Label><Form.Control type="text" name="last_name" value={formData.last_name || ''} onChange={handleFormChange} required /></Form.Group></Col>
                  </Row>
                  <Form.Group className="mb-3"><Form.Label>Phone Number</Form.Label><Form.Control type="tel" name="phone_number" value={formData.phone_number || ''} onChange={handleFormChange} /></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Age</Form.Label><Form.Control type="number" name="age" value={formData.age || ''} onChange={handleFormChange} /></Form.Group>
                  <Row>
                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Current Activity</Form.Label><Form.Select name="current_activity" value={formData.current_activity || 'Other'} onChange={handleFormChange}><option>Studying</option><option>Working</option><option>Other</option></Form.Select></Form.Group></Col>
                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Institution/Company</Form.Label><Form.Control type="text" name="activity_place" value={formData.activity_place || ''} onChange={handleFormChange} /></Form.Group></Col>
                  </Row>
                  <Button variant="primary" type="submit">Save Changes</Button>
                </Form>
              ) : (
                // --- VIEWING MODE ---
                <ListGroup variant="flush">
                  <ListGroup.Item><strong>Full Name:</strong> {profileData?.first_name} {profileData?.last_name}</ListGroup.Item>
                  <ListGroup.Item><strong>Username:</strong> {profileData?.username}</ListGroup.Item>
                  <ListGroup.Item><strong>Email:</strong> {profileData?.email}</ListGroup.Item>
                  <ListGroup.Item><strong>Account Role:</strong> <span className="text-capitalize">{profileData?.role}</span></ListGroup.Item>
                  <ListGroup.Item><strong>Phone Number:</strong> {profileData?.phone_number || 'Not provided'}</ListGroup.Item>
                  <ListGroup.Item><strong>Age:</strong> {profileData?.age || 'Not provided'}</ListGroup.Item>
                  <ListGroup.Item><strong>Current Activity:</strong> {profileData?.current_activity || 'Not provided'}</ListGroup.Item>
                  <ListGroup.Item><strong>Institution/Company:</strong> {profileData?.activity_place || 'Not provided'}</ListGroup.Item>
                  <ListGroup.Item><strong>Member Since:</strong> {new Date(profileData?.created_at).toLocaleDateString()}</ListGroup.Item>
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;

