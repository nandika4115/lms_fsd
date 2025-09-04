import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

// A palette of 5 bright, modern colors for the course cards
const cardColors = ['#4DB6AC', '#7986CB', '#FFB74D', '#F06292', '#9575CD']; // Teal, Indigo, Orange, Pink, Deep Purple

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState({});
  const { user } = useContext(AuthContext);
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

  const handleEnroll = async (courseId, courseTitle) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("You must be logged in to enroll.");
      navigate('/login');
      return;
    }

    setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: 'Enrolling...', type: 'info' } }));

    try {
      const response = await axios.post(
        `${API_URL}/api/enroll`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: response.data.message, type: 'success' } }));
    } catch (err) {
      setEnrollmentStatus(prev => ({ 
        ...prev, 
        [courseId]: { message: err.response?.data?.message || `Failed to enroll.`, type: 'danger' } 
      }));
    }
  };


  if (loading) {
    return <Container className="text-center my-5"><Spinner animation="border" variant="primary" /></Container>;
  }
  if (error) {
    return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <div className="courses-page-background">
      <Container className="py-5">
        <div className="page-header text-center mb-5">
          <h1 className="display-4 fw-bold">Explore Our Courses</h1>
          <p className="lead text-muted">Find your next learning opportunity from our expert-led courses.</p>
        </div>
        <Row>
          {courses.map((course, index) => {
            const status = enrollmentStatus[course.id];
            const isEnrolled = status?.type === 'success';
            
            const color = cardColors[index % cardColors.length];
            const placeholderUrl = `https://placehold.co/600x400/${color.substring(1)}/FFFFFF?text=${course.title.replace(/\s/g, '+')}`;

            return (
              <Col md={6} lg={4} key={course.id} className="mb-4">
                <Card 
                  className="h-100 course-card rounded-4 shadow-sm" 
                  style={{ borderTop: `5px solid ${color}` }}
                >
                  <Card.Img 
                    variant="top" 
                    src={placeholderUrl} 
                    className="course-card-img"
                  />
                  <Card.Body className="d-flex flex-column p-4">
                    <Card.Title as="h5" className="fw-bold">{course.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      Taught by: {course.instructor_name}
                    </Card.Subtitle>
                    {/* ✨ Added a new class to control text length and removed flex-grow-1 */}
                    <Card.Text className="course-card-text">
                      {course.description}
                    </Card.Text>
                    
                    {/* This div now pushes the buttons to the bottom */}
                    <div className="mt-auto"> 
                      {status && !isEnrolled && <Alert variant={status.type} className="mt-3 py-2">{status.message}</Alert>}
                      {isEnrolled && <Alert variant="success" className="mt-3 py-2">{status.message}</Alert>}
                      
                      <div className="mt-4">
                        <Button as={Link} to={`/courses/${course.id}`} variant="primary" className="me-2">View Details</Button>
                        {user && user.role === 'student' && (
                          <Button 
                            variant={isEnrolled ? "outline-success" : "success"}
                            onClick={() => handleEnroll(course.id, course.title)}
                            disabled={isEnrolled}
                          >
                            {isEnrolled ? 'Enrolled' : 'Enroll Now'}
                          </Button>
                        )}
                      </div>
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

