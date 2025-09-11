import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

// --- Student Dashboard Component ---
const StudentDashboard = ({ data }) => (
    <div>
        <h2 className="mb-4">My Enrolled Courses</h2>
        {data.length > 0 ? (
            <Row>
                {data.map(enrollment => {
                    const progress = enrollment.total_lessons > 0 ? (enrollment.completed_lessons / enrollment.total_lessons) * 100 : 0;
                    return (
                        <Col md={6} lg={4} key={enrollment.course_id} className="mb-4">
                            <Card className="h-100 course-card-new shadow-sm">
                                <Card.Img variant="top" src={enrollment.thumbnail_url || 'https://placehold.co/600x400/A3E635/000000?text=Course'} style={{ height: '180px', objectFit: 'cover' }}/>
                                <Card.Body>
                                    <Card.Title as="h5" className="fw-bold">{enrollment.course_title}</Card.Title>
                                    <Card.Text className="text-muted">
                                        Progress: {enrollment.completed_lessons} / {enrollment.total_lessons} lessons
                                    </Card.Text>
                                    <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mb-3" />
                                    <Button as={Link} to={`/courses/${enrollment.course_id}`} variant="primary">Go to Course</Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        ) : (
            <p>You are not yet enrolled in any courses. <Link to="/courses">Explore courses</Link> to get started!</p>
        )}
    </div>
);

// --- FINAL Instructor Dashboard Component ---
const InstructorDashboard = ({ data }) => {
    const [courses, setCourses] = useState(data);

    useEffect(() => {
        setCourses(data);
    }, [data]);

    const handleDelete = async (courseId) => {
        if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
            const token = localStorage.getItem('token');
            try {
                await axios.delete(`${API_URL}/api/courses/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourses(currentCourses => currentCourses.filter(c => c.course_id !== courseId));
            } catch (err) {
                alert("Failed to delete course. Please try again.");
            }
        }
    };

    const handleStatusToggle = async (courseId, currentStatus) => {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        const token = localStorage.getItem('token');
        try {
            await axios.patch(`${API_URL}/api/courses/${courseId}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(currentCourses => currentCourses.map(c =>
                c.course_id === courseId ? { ...c, status: newStatus } : c
            ));
        } catch (err) {
            alert("Failed to update status. Please try again.");
        }
    };

    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, course) => sum + (course.enrollment_count || 0), 0);
    const totalLessons = courses.reduce((sum, course) => sum + (course.lesson_count || 0), 0);

    return (
        <div>
            <h2 className="mb-4">Teaching Stats</h2>
            <Row className="mb-5">
                <Col md={4}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{totalCourses}</h4><p className="text-muted mb-0">Total Courses</p></Card></Col>
                <Col md={4}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{totalStudents}</h4><p className="text-muted mb-0">Total Enrollments</p></Card></Col>
                <Col md={4}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{totalLessons}</h4><p className="text-muted mb-0">Total Lessons</p></Card></Col>
            </Row>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>My Courses</h2>
                <Button as={Link} to="/create-course" variant="primary">Create New Course</Button>
            </div>

            {courses.length > 0 ? (
                <Row>
                    {courses.map(course => (
                        <Col md={6} lg={4} key={course.course_id} className="mb-4">
                            <Card className="h-100 shadow-sm">
                                <Card.Img variant="top" src={course.thumbnail_url || 'https://placehold.co/600x400'} style={{ height: '180px', objectFit: 'cover' }} />
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title as="h5" className="fw-bold">{course.course_title}</Card.Title>
                                    <div className="mt-auto">
                                        <span className={`badge ${course.status === 'published' ? 'bg-success' : 'bg-secondary'}`}>{course.status}</span>
                                    </div>
                                </Card.Body>
                                <Card.Footer className="bg-white border-0 p-3">
                                    <div className="d-grid gap-2">
                                        <Button as={Link} to={`/manage-course/${course.course_id}`} variant="primary">Manage Course</Button>
                                        <div className="d-flex" style={{ gap: '0.5rem' }}>
                                            <Button as={Link} to={`/edit-course/${course.course_id}`} variant="outline-secondary" className="w-100">Edit</Button>
                                            <Button onClick={() => handleStatusToggle(course.course_id, course.status)} variant={course.status === 'published' ? 'outline-warning' : 'outline-success'} className="w-100">
                                                {course.status === 'published' ? 'Unpublish' : 'Publish'}
                                            </Button>
                                            <Button onClick={() => handleDelete(course.course_id)} variant="outline-danger" className="w-100">Delete</Button>
                                        </div>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <p>You have not created any courses yet. <Link to="/create-course">Create one</Link> to get started!</p>
            )}
        </div>
    );
};

// --- Main Dashboard Page (No changes needed) ---
function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, isAuthLoading } = useContext(AuthContext);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (isAuthLoading || !user) {
                if (!isAuthLoading && !user) setLoading(false);
                return;
            }
            const token = localStorage.getItem('token');
            if (!token) {
                setError("You must be logged in to view the dashboard.");
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get(`${API_URL}/api/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDashboardData(response.data);
            } catch (err) {
                setError("Could not load your dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user, isAuthLoading]);

    if (isAuthLoading || loading) {
        return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    }
    if (error) {
        return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    }
    if (!user) {
        return (
            <Container className="my-5 text-center">
                <Alert variant="warning">Please <Link to="/login">log in</Link> to view your dashboard.</Alert>
            </Container>
        )
    }

    return (
        <Container className="my-5">
            <h1 className="mb-5">Welcome to your Dashboard, {user?.name || user?.username}!</h1>
            {user?.role === 'student' ? (
                <StudentDashboard data={dashboardData} />
            ) : user?.role === 'instructor' ? (
                <InstructorDashboard data={dashboardData || []} />
            ) : (
                <p>Your dashboard is being prepared. Please check back later.</p>
            )}
        </Container>
    );
}

export default Dashboard;

