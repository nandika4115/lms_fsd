import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, ListGroup, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState({ message: '', type: '' });
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/courses/${id}`);
        setCourse(response.data);
        setError('');
      } catch (err) {
        console.error("Failed to fetch course details:", err);
        setError("Could not load course details. It may not exist or an error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  // --- Updated Enrollment Handler ---
  const handleEnroll = async () => {
    // 1. Get the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      alert("You must be logged in to enroll.");
      navigate('/login');
      return;
    }

    try {
      // 2. Make an authenticated POST request to the new endpoint
      const response = await axios.post(
        `${API_URL}/api/enroll`, 
        { courseId: id }, // Send the courseId in the request body
        { headers: { Authorization: `Bearer ${token}` } } // Include the JWT for authentication
      );
      // 3. Show a success message
      setEnrollmentStatus({ message: response.data.message, type: 'success' });
    } catch (err) {
      console.error("Enrollment failed:", err);
      // 4. Show an error message from the backend
      setEnrollmentStatus({ message: err.response?.data?.message || "Enrollment failed.", type: 'danger' });
    }
  };

  if (loading) {
    return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
  }

  if (error) {
    return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  if (!course) return null;

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <h1 className="mb-3">{course.title}</h1>
          <p className="text-muted fs-5">Taught by: {course.instructor_name}</p>
          <hr />
          <p className="lead mt-4">{course.description}</p>
        </Col>
      </Row>
      <Row className="justify-content-center mt-5">
        <Col lg={8}>
            <Card>
                <Card.Header as="h4">Course Curriculum</Card.Header>
                <Card.Body>
                    <ListGroup variant="flush">
                        {course.lessons?.length > 0 ? (
                            course.lessons.map(lesson => (
                                <ListGroup.Item key={lesson.id}>{lesson.title}</ListGroup.Item>
                            ))
                        ) : (
                            <ListGroup.Item>No lessons have been added yet.</ListGroup.Item>
                        )}
                    </ListGroup>
                </Card.Body>
                {user && user.role === 'student' && (
                    <Card.Footer>
                        {/* Show enrollment status message if it exists */}
                        {enrollmentStatus.message && (
                            <Alert variant={enrollmentStatus.type} className="mt-3 mb-0">
                                {enrollmentStatus.message}
                            </Alert>
                        )}
                        <Button 
                            variant="success" 
                            className="w-100 mt-3" 
                            onClick={handleEnroll}
                            // Disable the button after a successful enrollment to prevent duplicates
                            disabled={enrollmentStatus.type === 'success'} 
                        >
                            {enrollmentStatus.type === 'success' ? 'Successfully Enrolled!' : 'Enroll Now'}
                        </Button>
                    </Card.Footer>
                )}
            </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CourseDetail;

