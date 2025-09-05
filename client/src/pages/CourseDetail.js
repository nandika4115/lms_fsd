import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Book, CodeSlash, Brush, CollectionPlay } from 'react-bootstrap-icons';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

const lessonCardStyles = [
  { color: '#E8F5E9', icon: <CodeSlash size={30} className="text-success" /> },
  { color: '#E3F2FD', icon: <Book size={30} className="text-primary" /> },
  { color: '#FFF3E0', icon: <Brush size={30} className="text-warning" /> },
  { color: '#F3E5F5', icon: <CollectionPlay size={30} className="text-info" /> }
];

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState({ message: '', type: '' });
  // ✨ Get the enrollment data and functions from the context
  const { user, enrolledCourseIds, addEnrollment } = useContext(AuthContext);
  const navigate = useNavigate();

  // ✨ Check if the user is enrolled in THIS specific course
  const isEnrolled = enrolledCourseIds.has(parseInt(id));

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/courses/${id}`);
        setCourse(response.data);
      } catch (err) {
        setError("Could not load course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleEnroll = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/api/enroll`, { courseId: id }, { headers: { Authorization: `Bearer ${token}` } });
      setEnrollmentStatus({ message: response.data.message, type: 'success' });
      addEnrollment(parseInt(id)); // Instantly update the global state
    } catch (err) {
      setEnrollmentStatus({ message: err.response?.data?.message || "Enrollment failed.", type: 'danger' });
    }
  };

  if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
  if (!course) return null;

  return (
    <div className="course-detail-page">
      <Container className="text-center py-5">
        <h1 className="display-4 fw-bold">{course.title}</h1>
        <p className="lead text-muted">Taught by {course.instructor_name}</p>
        <p className="mt-4" style={{ maxWidth: '700px', margin: 'auto' }}>{course.description}</p>
        
        {/* ✨ Conditionally render the correct button based on enrollment status ✨ */}
        {user && user.role === 'student' && (
             <div className="mt-4">
                 {enrollmentStatus.message && (
                    <Alert variant={enrollmentStatus.type} className="d-inline-block">
                        {enrollmentStatus.message}
                    </Alert>
                )}
                 <Button 
                    variant={isEnrolled ? "success" : "primary"}
                    size="lg"
                    onClick={handleEnroll}
                    // Disable the button if already enrolled or enrollment was just successful
                    disabled={isEnrolled || enrollmentStatus.type === 'success'}
                    className={isEnrolled ? 'enrolled-btn' : ''}
                 >
                    {isEnrolled || enrollmentStatus.type === 'success' ? 'Enrolled' : 'Enroll Now'}
                 </Button>
             </div>
        )}
      </Container>

      <div className="curriculum-section py-5">
        <Container>
          <h2 className="text-center fw-bold mb-5">What You'll Learn</h2>
          <Row>
            {course.lessons?.length > 0 ? (
              course.lessons.map((lesson, index) => {
                const style = lessonCardStyles[index % lessonCardStyles.length];
                return (
                  <Col md={6} lg={3} key={lesson.id} className="mb-4">
                    <Card className="h-100 lesson-card" style={{ backgroundColor: style.color }}>
                      <Card.Body>
                        <div className="d-flex align-items-center mb-3">
                            {style.icon}
                            <span className="ms-2 text-muted fw-bold">Lesson {index + 1}</span>
                        </div>
                        <Card.Title as="h5" className="fw-bold">{lesson.title}</Card.Title>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            ) : (
              <Col><p className="text-center text-muted">Curriculum is being updated. Please check back soon!</p></Col>
            )}
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default CourseDetail;

