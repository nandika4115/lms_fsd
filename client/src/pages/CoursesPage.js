import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { CodeSlash, Brush, GraphUp, Search, PlayCircleFill } from 'react-bootstrap-icons';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useEnrollment } from '../hooks/useEnrollment';

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
    const [filters, setFilters] = useState({ categories: [], levels: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');

    const { handleEnroll, enrollmentStatus } = useEnrollment();
    const { user, enrolledCourseIds } = useContext(AuthContext);

    useEffect(() => {
        const fetchCourses = async () => {
            const token = localStorage.getItem('token'); // Get the token
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/courses`, {
                    params: { search: searchTerm, category: selectedCategory, level: selectedLevel },
                    // --- THIS IS THE FIX ---
                    // Send the token with the request so the server can calculate the resume link
                    headers: { Authorization: `Bearer ${token}` } 
                });
                setCourses(response.data);
            } catch (err) {
                setError("Could not load courses.");
            } finally {
                setLoading(false);
            }
        };
        const delayDebounceFn = setTimeout(() => { fetchCourses(); }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedCategory, selectedLevel, user]); // Re-fetch if user logs in/out

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/courses/filters`);
                setFilters(response.data || { categories: [], levels: [] });
            } catch (err) {
                console.error("Could not fetch filters:", err);
            }
        };
        fetchFilters();
    }, []);

    if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <div className="courses-page-background">
            <Container className="py-5">
                <div className="page-header text-center mb-5">
                    <h1 className="display-4 fw-bold">Explore Our Courses</h1>
                    <p className="lead text-muted">Find your next learning opportunity from our expert-led courses.</p>
                </div>

                <Card className="p-3 mb-5 shadow-sm">
                    <Row className="g-3 align-items-center">
                        <Col lg={6} md={12}><InputGroup><InputGroup.Text><Search /></InputGroup.Text><Form.Control type="text" placeholder="Search by course title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></InputGroup></Col>
                        <Col lg={3} md={6}><Form.Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}><option value="">All Categories</option>{filters.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</Form.Select></Col>
                        <Col lg={3} md={6}><Form.Select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}><option value="">All Levels</option>{filters.levels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}</Form.Select></Col>
                    </Row>
                </Card>

                {loading ? (
                    <div className="text-center"><Spinner animation="border" /></div>
                ) : (
                    <Row>
                        {courses.length > 0 ? courses.map((course, index) => {
                            const isEnrolled = enrolledCourseIds.has(course.id);
                            const status = enrollmentStatus[course.id];
                            const style = cardStyles[index % cardStyles.length];

                            // --- THIS IS THE NEW LOGIC FOR THE RESUME BUTTON LINK ---
                            const resumeLink = course.resumeLessonId
                                ? `/courses/${course.id}/lessons/${course.resumeLessonId}`
                                : `/courses/${course.id}`; // Fallback to the course detail page

                            return (
                                <Col md={6} lg={4} key={course.id} className="mb-4">
                                    <Card className="h-100 course-card-new" style={{ backgroundColor: style.color }}>
                                        <Card.Body className="p-4 d-flex flex-column">
                                            <div className="mb-3">{style.icon}</div>
                                            <Card.Title as="h4" className="fw-bold course-card-title">{course.title}</Card.Title>
                                            <Card.Text className="course-card-text mb-4">{course.description}</Card.Text>
                                            
                                            <div className="mt-auto">
                                                {isEnrolled ? (
                                                    <div>
                                                        <Button variant="success" className="w-100 mb-2" style={{ backgroundColor: '#28a745', borderColor: '#28a745' }} disabled>Enrolled</Button>
                                                        <div className="d-flex gap-2">
                                                            <Button as={Link} to={`/courses/${course.id}`} variant="dark" className="w-50">View</Button>
                                                            {/* This button now uses the smart resumeLink */}
                                                            <Button as={Link} to={resumeLink} variant="dark" className="w-50">
                                                                <PlayCircleFill className="me-1"/> Resume
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {status && <Alert variant={status.type} className="py-2 mb-3">{status.message}</Alert>}
                                                        <div className="d-flex gap-2">
                                                            <Button as={Link} to={`/courses/${course.id}`} variant="dark" className="w-100">Details</Button>
                                                            {user && user.role === 'student' && (
                                                                <Button 
                                                                    variant="primary"
                                                                    className="w-100"
                                                                    onClick={() => handleEnroll(course.id)}
                                                                    disabled={status?.type === 'info' || status?.type === 'success'}
                                                                >
                                                                    {status?.type === 'info' ? 'Enrolling...' : 'Enroll'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        }) : (
                            <Col><Alert variant="info">No courses found matching your criteria.</Alert></Col>
                        )}
                    </Row>
                )}
            </Container>
        </div>
    );
}

export default CoursesPage;

