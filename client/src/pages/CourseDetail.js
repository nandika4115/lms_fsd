import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { Book, CodeSlash, Brush, CollectionPlay, CheckCircleFill, PlayCircleFill, AwardFill } from 'react-bootstrap-icons';
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
    const [hasCertificate, setHasCertificate] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const { user, enrolledCourseIds } = useContext(AuthContext);
    const navigate = useNavigate();

    const isEnrolled = enrolledCourseIds.has(parseInt(id));

    useEffect(() => {
        let isMounted = true;
        const fetchAllData = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            try {
                const courseResponse = await axios.get(
                    `${API_URL}/api/courses/${id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (!isMounted) return;
                setCourse(courseResponse.data);

                if (token && enrolledCourseIds.has(parseInt(id))) {
                    try {
                        await axios.get(
                            `${API_URL}/api/certificates/course/${id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (isMounted) setHasCertificate(true);
                    } catch (certError) {
                        if (isMounted) setHasCertificate(false);
                    }
                }
            } catch (err) {
                if (isMounted) setError("Could not load course details.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (id) {
            fetchAllData();
        }

        return () => { isMounted = false; };
    }, [id, enrolledCourseIds, user]);
    
    const isCourseComplete = isEnrolled && course && course.lessons?.length > 0 && course.resumeLessonId === null;

    const handleCertificateAction = async () => {
        if (!isCourseComplete && !hasCertificate) {
            setModalMessage("You must complete all lessons before getting a certificate.");
            setShowModal(true);
            return;
        }
        
        const token = localStorage.getItem('token');
        try {
            // If they already have a certificate, just navigate to it.
            if (hasCertificate) {
                navigate(`/courses/${id}/certificate`);
                return;
            }
            // Otherwise, generate it and then navigate.
            await axios.post(`${API_URL}/api/certificates/course/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            navigate(`/courses/${id}/certificate`);
        } catch (err) {
            setModalMessage(err.response?.data?.message || "Could not generate or view the certificate.");
            setShowModal(true);
        }
    };

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!course) return <Container className="my-5"><Alert variant="info">Course not found.</Alert></Container>;

    const resumeLink = course.resumeLessonId 
        ? `/courses/${id}/lessons/${course.resumeLessonId}`
        : (course.lessons && course.lessons.length > 0 ? `/courses/${id}/lessons/${course.lessons[0].id}` : '#');
        
    return (
        <div className="course-detail-page">
            <Container className="text-center py-5">
                <h1 className="display-4 fw-bold">{course.title}</h1>
                <p className="lead text-muted">Taught by {course.instructor_name || 'a great instructor'}</p>
                <p className="mt-4" style={{ maxWidth: '700px', margin: 'auto' }}>{course.description}</p>
                
                {user && user.role === 'student' && (
                    <div className="mt-4">
                        {isEnrolled ? (
                            <div className="d-flex justify-content-center align-items-center gap-2">
                                {isCourseComplete ? (
                                    <Button variant="success" size="lg" disabled>
                                        <CheckCircleFill className="me-2" /> Course Completed
                                    </Button>
                                ) : (
                                    <Button as={Link} to={resumeLink} variant="success" size="lg">
                                        <PlayCircleFill className="me-2" />
                                        {course.lessons.some(l => l.is_completed) ? 'Resume Course' : 'Start Course'}
                                    </Button>
                                )}
                                <Button variant="warning" size="lg" onClick={handleCertificateAction}>
                                    <AwardFill className="me-2" /> 
                                    {hasCertificate ? 'View Certificate' : 'Get Certificate'}
                                </Button>
                            </div>
                        ) : (
                           <Button variant="primary" size="lg" as={Link} to="/courses">
                               Enroll on Courses Page
                           </Button>
                        )}
                    </div>
                )}
            </Container>

            <div className="curriculum-section py-5 bg-light">
                <Container>
                    <h2 className="text-center fw-bold mb-5">Course Curriculum</h2>
                    <Row>
                        {course.lessons?.length > 0 ? (
                            course.lessons.map((lesson, index) => (
                                <Col md={6} lg={4} key={lesson.id} className="mb-4">
                                    <Link to={`/courses/${id}/lessons/${lesson.id}`} className="text-decoration-none">
                                        <Card className="h-100 lesson-card lesson-card-link border-0 shadow-sm" style={{ backgroundColor: lessonCardStyles[index % lessonCardStyles.length].color }}>
                                            <Card.Body>
                                                <div className="d-flex align-items-center mb-3">
                                                    {lessonCardStyles[index % lessonCardStyles.length].icon}
                                                    <span className="ms-2 text-muted fw-bold">Lesson {index + 1}</span>
                                                    {lesson.is_completed && <CheckCircleFill className="ms-auto text-success" />}
                                                </div>
                                                <Card.Title as="h5" className="fw-bold text-dark">{lesson.title}</Card.Title>
                                            </Card.Body>
                                        </Card>
                                    </Link>
                                </Col>
                            ))
                        ) : (
                            <Col><p className="text-center text-muted">Curriculum is being updated. Please check back soon!</p></Col>
                        )}
                    </Row>
                </Container>
            </div>

            {/* Certificate Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#f8d7da', borderBottom: '1px solid #f5c6cb' }}>
                    <Modal.Title style={{ color: '#721c24', fontWeight: 'bold' }}>
                        ⚠️ Notice
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ color: '#721c24', fontSize: '1.1rem' }}>
                    {modalMessage}
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
                    <Button variant="secondary" onClick={() => setShowModal(false)} style={{ borderRadius: '8px' }}>
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default CourseDetail;