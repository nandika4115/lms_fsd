import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { CodeSlash, Brush, GraphUp, Search } from 'react-bootstrap-icons';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
// Step 1: Import the custom hook we just created
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
    
    // --- State for Filters and Search ---
    const [filters, setFilters] = useState({ categories: [], levels: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');

    // Step 2: Use the hook to get the enrollment function and status object
    const { handleEnroll, enrollmentStatus } = useEnrollment();
    const { user, enrolledCourseIds } = useContext(AuthContext);

    // --- Effect to fetch courses whenever a filter or search term changes ---
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                // Pass the current filter state as URL parameters to the backend API
                const response = await axios.get(`${API_URL}/api/courses`, {
                    params: {
                        search: searchTerm,
                        category: selectedCategory,
                        level: selectedLevel
                    }
                });
                setCourses(response.data);
            } catch (err) {
                setError("Could not load courses.");
            } finally {
                setLoading(false);
            }
        };
        // This "debounces" the search input. It waits 500ms after the user stops typing
        // before making an API call, which prevents excessive requests.
        const delayDebounceFn = setTimeout(() => {
            fetchCourses();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedCategory, selectedLevel]); // Re-run this effect when any filter changes

    // --- Effect to fetch the dynamic filter options (categories and levels) ---
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/courses/filters`);
                setFilters(response.data);
            } catch (err) {
                console.error("Could not fetch filters:", err);
            }
        };
        fetchFilters();
    }, []); // The empty array [] means this effect runs only once when the page loads

    if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <div className="courses-page-background">
            <Container className="py-5">
                <div className="page-header text-center mb-5">
                    <h1 className="display-4 fw-bold">Explore Our Courses</h1>
                    <p className="lead text-muted">Find your next learning opportunity from our expert-led courses.</p>
                </div>

                {/* --- Search and Filter UI --- */}
                <Card className="p-3 mb-5 shadow-sm">
                    <Row className="g-3 align-items-center">
                        <Col lg={6} md={12}>
                            <InputGroup>
                                <InputGroup.Text><Search /></InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by course title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col lg={3} md={6}>
                            <Form.Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                <option value="">All Categories</option>
                                {/* ✅ FIX: Added optional chaining (?.) to prevent errors if filters.categories is not available yet */}
                                {filters?.categories?.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </Form.Select>
                        </Col>
                        <Col lg={3} md={6}>
                            <Form.Select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
                                <option value="">All Levels</option>
                                {/* ✅ FIX: Added optional chaining (?.) here as well for safety */}
                                {filters?.levels?.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                            </Form.Select>
                        </Col>
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
                                                        {/* ✅ FIX: Changed variant to "success" for a solid green color. */}
                                                        <Button variant="success" className="w-100 mb-2" disabled>Enrolled</Button>
                                                        {/* ✅ FIX: Restored the View and Resume buttons. */}
                                                        <div className="d-flex">
                                                            <Button as={Link} to={`/courses/${course.id}`} variant="dark" className="course-card-btn flex-grow-1 me-1">View</Button>
                                                            <Button as={Link} to={`/courses/${course.id}/resume`} variant="dark" className="course-card-btn flex-grow-1 ms-1">Resume</Button>
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
                            <Col><Alert variant="info">No courses found matching your criteria. Try adjusting your search or filters.</Alert></Col>
                        )}
                    </Row>
                )}
            </Container>
        </div>
    );
}

export default CoursesPage;

