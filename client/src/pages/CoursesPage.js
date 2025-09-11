import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { CodeSlash, Brush, GraphUp } from 'react-bootstrap-icons';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";
const cardStyles = [
  { color: '#E8F5E9', icon: <CodeSlash size={40} className="text-success" /> },
  { color: '#E3F2FD', icon: <GraphUp size={40} className="text-primary" /> },
  { color: '#FFF3E0', icon: <Brush size={40} className="text-warning" /> }
];

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState({});
  // ✨ Get the new enrollment data and functions from AuthContext
  const { user, enrolledCourseIds, addEnrollment } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/courses`);
        setCourses(response.data);
      } catch (err) {
        setError("Could not load courses.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

// In client/src/pages/CoursesPage.js

const handleEnroll = async (courseId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        navigate('/login');
        return;
    }
    setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: 'Enrolling...', type: 'info' } }));
    try {
        const response = await axios.post(
            // ✅ THE FIX: Move the courseId into the URL path
            `${API_URL}/api/enrollments/${courseId}`, 
            {}, // The body is now an empty object
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: response.data.message, type: 'success' } }));
        addEnrollment(courseId);
    } catch (err) {
        setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: err.response?.data?.message || `Failed to enroll.`, type: 'danger' } }));
    }
};
  if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <div className="courses-page-background">
      <Container className="py-5">
        <div className="page-header text-center mb-5">
          <h1 className="display-4 fw-bold">Explore Our Courses</h1>
          <p className="lead text-muted">Find your next learning opportunity from our expert-led courses.</p>
        </div>
        <Row>
          {courses.map((course, index) => {
            // ✨ Check if the student is enrolled using the data from AuthContext
            const isEnrolled = enrolledCourseIds.has(course.id);
            const status = enrollmentStatus[course.id];
            const style = cardStyles[index % cardStyles.length];

            return (
              <Col md={6} lg={4} key={course.id} className="mb-4">
                <Card className="h-100 course-card-new" style={{ backgroundColor: style.color }}>
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="mb-3">{style.icon}</div>
                    <Card.Title as="h4" className="fw-bold course-card-title">{course.title}</Card.Title>
                    <Card.Text className="course-card-text mb-4">{course.description}</Card.Text>
                    
                    <div className="mt-auto">
                      {isEnrolled ? (
                        // --- ✨ New UI for Enrolled Students ✨ ---
                        <div>
                          <Button variant="success" className="w-100 mb-2 enrolled-btn" disabled>Enrolled</Button>
                          <div className="d-flex">
                              <Button as={Link} to={`/courses/${course.id}`} variant="dark" className="course-card-btn flex-grow-1 me-1">View</Button>
                              <Button as={Link} to={`/courses/${course.id}/resume`} variant="dark" className="course-card-btn flex-grow-1 ms-1">Resume</Button>
                          </div>
                        </div>
                      ) : (
                        // --- UI for Not Enrolled Users ---
                        <div>
                           {status && <Alert variant={status.type} className="py-2 mb-3">{status.message}</Alert>}
                           <Button as={Link} to={`/courses/${course.id}`} variant="dark" className="course-card-btn me-2">View Details</Button>
                           {user && user.role === 'student' && (
                            <Button 
                              variant="dark"
                              className="course-card-btn"
                              onClick={() => handleEnroll(course.id)}
                              disabled={status?.type === 'success'}
                            >
                              {/* Show "Enrolling..." while the API call is in progress */}
                              {status?.type === 'info' ? 'Enrolling...' : 'Enroll Now'}
                            </Button>
                           )}
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </div>
  );
}

export default CoursesPage;

