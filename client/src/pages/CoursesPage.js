import React, { useState, useEffect, useContext } from 'react';
import { Container,Card, Row, Col, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useEnrollment } from '../hooks/useEnrollment';
import CourseCard from '../components/CourseCard'; // Added import for CourseCard

const API_URL = "http://localhost:5000";

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
            const token = localStorage.getItem('token');
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/courses`, {
                    params: { search: searchTerm, category: selectedCategory, level: selectedLevel },
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
    }, [searchTerm, selectedCategory, selectedLevel, user]);

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
                                {filters.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </Form.Select>
                        </Col>
                        <Col lg={3} md={6}>
                            <Form.Select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
                                <option value="">All Levels</option>
                                {filters.levels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
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
                            const resumeLink = course.resumeLessonId
  ? `/courses/${course.id}/lessons/${course.resumeLessonId}`
  : (course.lessons && course.lessons.length > 0 ? `/courses/${course.id}/lessons/${course.lessons[0].id}` : '#');


                            return (
                                <Col md={6} lg={4} key={course.id} className="mb-4">

                                    <CourseCard
                                        course={course}
                                        index={index}
                                        isEnrolled={isEnrolled}
                                        status={status}
                                        user={user}
                                        onEnroll={handleEnroll}
                                        showResume={true}
                                        resumeLink={resumeLink}
                                        showEnroll={!!user}
                                        showDetails={true}
                                    />
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
