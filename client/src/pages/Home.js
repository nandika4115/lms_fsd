import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Image, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { CodeSlash, Brush, GraphUp } from 'react-bootstrap-icons';
import axios from 'axios';
import AuthContext from '../context/AuthContext'; // Import AuthContext

const API_URL = "http://localhost:5000";

const cardStyles = [
  { color: '#E8F5E9', icon: <CodeSlash size={40} className="text-success" /> },
  { color: '#E3F2FD', icon: <GraphUp size={40} className="text-primary" /> },
  { color: '#FFF3E0', icon: <Brush size={40} className="text-warning" /> }
];

// --- ✨ Featured Courses Component (Upgraded with Enrollment Logic) ✨ ---
function FeaturedCourses() {
  const [courses, setCourses] = useState([]);
  // Get all the necessary data and functions from the AuthContext
  const { user, enrolledCourseIds, addEnrollment } = useContext(AuthContext);
  const [enrollmentStatus, setEnrollmentStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/courses`);
        setCourses(response.data.slice(0, 3));
      } catch (error) {
        console.error("Could not fetch featured courses:", error);
      }
    };
    fetchFeaturedCourses();
  }, []);

  // This is the same enrollment handler from the CoursesPage
  const handleEnroll = async (courseId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: 'Enrolling...', type: 'info' } }));
    try {
      const response = await axios.post(`${API_URL}/api/enroll`, { courseId }, { headers: { Authorization: `Bearer ${token}` } });
      setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: response.data.message, type: 'success' } }));
      addEnrollment(courseId); // Instantly update the global state
    } catch (err) {
      setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: err.response?.data?.message || `Failed to enroll.`, type: 'danger' } }));
    }
  };

  return (
    <div className="py-5">
      <Container>
        <h2 className="text-center fw-bold mb-5">Featured Courses</h2>
        <Row>
          {courses.map((course, index) => {
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
                        // --- UI for Enrolled Students ---
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

// --- Main Homepage Component (Unchanged) ---
function HomePage() {
  const { user } = useContext(AuthContext);

  return (
    <>
      <div className="hero-section text-white text-center">
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <h1 className="display-3 fw-bolder">Unlock Your Potential</h1>
              <p className="lead my-4">
                Join a community of learners and experts. Start your journey with EduLearnPro today and take your skills to the next level.
              </p>
              <Button as={Link} to="/courses" variant="light" size="lg">
                Explore Courses
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <div className="content-section-wrapper">
        <FeaturedCourses />

        <div className="about-section">
          <Container className="my-5 py-5">
            <Row className="align-items-center" id="about-us">
              <Col md={6} className="mb-4 mb-md-0">
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                  rounded
                  fluid
                  className="shadow-lg"
                  alt="Students collaborating and learning together"
                />
              </Col>
              <Col md={6}>
                <h2 className="fw-bold">About EduLearnPro</h2>
                <p className="text-muted">
                  We believe in a world where anyone, anywhere has the power to transform their life through learning. Our courses are curated and taught by industry experts who are passionate about sharing their knowledge.
                </p>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      {!user && (
        <div className="cta-section text-center py-5">
            <Container>
                <h2 className="fw-bold">Ready to Start Learning?</h2>
                <p className="text-muted my-3">Create an account to enroll in courses, track your progress, and join our community.</p>
                <Button as={Link} to="/register" variant="success" size="lg">
                    Sign Up for Free
                </Button>
            </Container>
        </div>
      )}
    </>
  );
}

export default HomePage;

