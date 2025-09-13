import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Book, CodeSlash, Brush, CollectionPlay, CheckCircleFill } from 'react-bootstrap-icons';
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
    const { user, enrolledCourseIds, addEnrollment } = useContext(AuthContext);
    const navigate = useNavigate();
    const isEnrolled = enrolledCourseIds.has(parseInt(id));

    useEffect(() => {
        const fetchCourse = async () => {
            const token = localStorage.getItem('token');
            try {
                setLoading(true);
                // --- THIS IS THE FIX ---
                // Add the Authorization header to the request so the server knows who you are.
                // This allows it to send back correct lesson completion data.
                const response = await axios.get(`${API_URL}/api/courses/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // --- END OF FIX ---
                setCourse(response.data);
            } catch (err) {
                setError("Could not load course details.");
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id, isEnrolled]); // Also re-fetch if enrollment status changes

    const handleEnroll = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        setEnrollmentStatus({ message: 'Enrolling...', type: 'info' });
        try {
            const response = await axios.post(
                `${API_URL}/api/enrollments/${id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEnrollmentStatus({ message: response.data.message, type: 'success' });
            addEnrollment(parseInt(id));
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
                <p className="lead text-muted">Taught by {course.instructor_name || 'a great instructor'}</p>
                <p className="mt-4" style={{ maxWidth: '700px', margin: 'auto' }}>{course.description}</p>
                
                {user && user.role === 'student' && (
                    <div className="mt-4">
                         {isEnrolled ? (
                             <Button as={Link} to={`/courses/${id}/lessons/${course.lessons[0]?.id || ''}`} variant="success" size="lg">
                                 Go to Course
                             </Button>
                        ) : (
                           <>
                            {enrollmentStatus.message && (
                                <Alert variant={enrollmentStatus.type} className="d-inline-block p-2 me-2">
                                    {enrollmentStatus.message}
                                </Alert>
                            )}
                            <Button
                                variant={enrollmentStatus.type === 'success' ? "success" : "primary"}
                                size="lg"
                                onClick={handleEnroll}
                                disabled={enrollmentStatus.type === 'success'}
                            >
                                {enrollmentStatus.type === 'success' ? 'Enrolled' : 'Enroll Now'}
                            </Button>
                           </>
                        )}
                    </div>
                )}
            </Container>

            <div className="curriculum-section py-5 bg-light">
                <Container>
                    <h2 className="text-center fw-bold mb-5">Course Curriculum</h2>
                    <Row>
                        {course.lessons?.length > 0 ? (
                            course.lessons.map((lesson, index) => {
                                const style = lessonCardStyles[index % lessonCardStyles.length];
                                return (
                                    <Col md={6} lg={4} key={lesson.id} className="mb-4">
                                        <Link to={`/courses/${id}/lessons/${lesson.id}`} className="text-decoration-none">
                                            <Card className="h-100 lesson-card lesson-card-link border-0 shadow-sm" style={{ backgroundColor: style.color }}>
                                                <Card.Body>
                                                    <div className="d-flex align-items-center mb-3">
                                                        {style.icon}
                                                        <span className="ms-2 text-muted fw-bold">Lesson {index + 1}</span>
                                                        {lesson.is_completed && <CheckCircleFill className="ms-auto text-success" />}
                                                    </div>
                                                    <Card.Title as="h5" className="fw-bold text-dark">{lesson.title}</Card.Title>
                                                </Card.Body>
                                            </Card>
                                        </Link>
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

