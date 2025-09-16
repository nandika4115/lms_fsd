import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, ListGroup, ProgressBar } from 'react-bootstrap';
import { CheckCircleFill, Circle, PlayBtn, ArrowLeft, ArrowRight } from 'react-bootstrap-icons';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

// Helper function to get the correct YouTube embed URL
const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    try {
        if (url.includes('watch?v=')) {
            const urlParams = new URLSearchParams(new URL(url).search);
            videoId = urlParams.get('v');
        } else if (url.includes('youtu.be')) {
            videoId = url.substring(url.lastIndexOf('/') + 1);
        } else if (url.includes('/embed/')) {
            videoId = url.substring(url.lastIndexOf('/') + 1);
        }
    } catch (e) { return ''; }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
};


function LessonPage() {
    const { courseId, lessonId } = useParams();
    const [course, setCourse] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAuthLoading } = useContext(AuthContext); // Get the loading status
    const navigate = useNavigate();

    // Fetch all course and lesson data
    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        const fetchCourseData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                setLoading(true);
                // --- THIS IS THE DEFINITIVE FIX ---
                // We add a unique timestamp to the request to "bust" the browser's cache.
                // This forces the browser to get the latest data from the server every time.
                const response = await axios.get(`${API_URL}/api/courses/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        timestamp: new Date().getTime() // Cache-busting parameter
                    }
                });
                // --- END OF FIX ---

                setCourse(response.data);
                const allLessons = response.data.lessons || [];
                setLessons(allLessons);
                
                const foundLesson = allLessons.find(l => l.id === parseInt(lessonId));
                
                if (foundLesson && foundLesson.content === null) {
                    setError("You must be enrolled in this course to view the lesson content.");
                } else if (foundLesson) {
                    setCurrentLesson(foundLesson);
                    setError('');
                } else {
                    setError("Lesson not found.");
                }

            } catch (err) {
                setError(err.response?.data?.message || "Could not load lesson data.");
            } finally {
                setLoading(false);
            }
        };
        fetchCourseData();
    }, [courseId, lessonId, isAuthLoading, navigate]);

    // Handler for the "Mark as Complete" button
    const handleMarkComplete = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_URL}/api/lessons/${lessonId}/complete`, 
                {}, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCurrentLesson(prev => ({ ...prev, is_completed: true }));
            setLessons(prev => prev.map(l => l.id === parseInt(lessonId) ? { ...l, is_completed: true } : l));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to mark lesson as complete.");
        }
    };

    // --- Navigation and Progress Logic ---
    const currentLessonIndex = lessons.findIndex(l => l.id === parseInt(lessonId));
    const nextLesson = lessons[currentLessonIndex + 1];
    const prevLesson = lessons[currentLessonIndex - 1];

    const completedLessonsCount = lessons.filter(l => l.is_completed).length;
    const totalLessonsCount = lessons.length;
    const courseProgress = totalLessonsCount > 0 ? (completedLessonsCount / totalLessonsCount) * 100 : 0;

    // --- Render Logic ---
    if (isAuthLoading || loading) {
        return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    }
    
    if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!currentLesson || !course) return <Container className="my-5"><Alert variant="warning">Lesson not found.</Alert></Container>;

    const embedUrl = getYouTubeEmbedUrl(currentLesson.content);

    return (
        <Container fluid className="my-4">
            <Row>
                {/* Lesson Content Column */}
                <Col md={8}>
                    <Card>
                        <Card.Header as="h4">{course.title}</Card.Header>
                        <Card.Body>
                            <h2 className="mb-4">{currentLesson.title}</h2>
                            {embedUrl ? (
                                <div className="ratio ratio-16x9">
                                    <iframe src={embedUrl} title="Lesson Video" frameBorder="0" allowFullScreen></iframe>
                                </div>
                            ) : (
                                <Alert variant="info">This lesson contains text-based content or the video is unavailable.</Alert>
                            )}
                        </Card.Body>
                        <Card.Footer className="d-flex justify-content-between align-items-center">
                            {/* Previous Button */}
                            {prevLesson ? (
                                <Button variant="outline-secondary" onClick={() => navigate(`/courses/${courseId}/lessons/${prevLesson.id}`)}><ArrowLeft /> Previous Lesson</Button>
                            ) : (
                                <Button variant="outline-secondary" disabled><ArrowLeft /> Previous Lesson</Button>
                            )}

                            {/* Mark as Complete Button */}
                            {!currentLesson.is_completed ? (
                                <Button variant="success" onClick={handleMarkComplete}>Mark as Complete</Button>
                            ) : (
                                <Button variant="success" disabled><CheckCircleFill /> Completed</Button>
                            )}

                            {/* Next Button */}
                            {nextLesson ? (
                                <Button variant="primary" onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}>Next Lesson <ArrowRight /></Button>
                            ) : (
                                <Button variant="primary" disabled>Next Lesson <ArrowRight /></Button>
                            )}
                        </Card.Footer>
                    </Card>
                </Col>

                {/* Course Progress & Lesson List Column */}
                <Col md={4}>
                    <Card>
                        <Card.Header as="h5">Course Progress</Card.Header>
                        <Card.Body>
                            <p>{completedLessonsCount} / {totalLessonsCount} lessons completed</p>
                            <ProgressBar now={courseProgress} label={`${Math.round(courseProgress)}%`} />
                        </Card.Body>
                        <ListGroup variant="flush">
                            {lessons.map(lesson => (
                                <ListGroup.Item 
                                    key={lesson.id} 
                                    as={Link} 
                                    to={`/courses/${courseId}/lessons/${lesson.id}`}
                                    className="d-flex justify-content-between align-items-center"
                                    active={lesson.id === currentLesson.id}
                                >
                                    {lesson.is_completed ? <CheckCircleFill className="text-success me-2" /> : <Circle className="text-muted me-2" />}
                                    <span className="flex-grow-1">{lesson.title}</span>
                                    {lesson.id === currentLesson.id && <PlayBtn className="text-primary"/>}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        {courseProgress === 100 && (
                             <Card.Footer className="text-center bg-success text-white">
                                 <strong>Congratulations! You've completed the course!</strong>
                             </Card.Footer>
                        )}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default LessonPage;

