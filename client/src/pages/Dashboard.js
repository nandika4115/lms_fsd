import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
// Import all necessary icons
import { Book, PeopleFill, PlayCircleFill, PatchCheckFill, StarFill, TrophyFill, MortarboardFill, Gem } from 'react-bootstrap-icons'; 

const API_URL = "http://localhost:5000";

// --- UPDATED: A map to make all achievements look nice on the frontend ---
const achievementMap = {
    'COURSE_COMPLETION_1': { icon: <TrophyFill />, title: 'First Course Completed', color: '#6f42c1' },
    'COURSE_COMPLETION_3': { icon: <StarFill />, title: 'Serial Learner (3 Courses)', color: '#fd7e14' },
    'COURSE_COMPLETION_5': { icon: <MortarboardFill />, title: 'Dedicated Scholar (5 Courses)', color: '#0d6efd' },
    'BADGE_COLLECTOR_3': { icon: <Gem />, title: 'Badge Collector (3 Achievements)', color: '#d63384' },
};


// --- The New, Upgraded Student Dashboard Component ---
const StudentDashboard = ({ data }) => {
    // --- ✅ UPDATED SECTION START ---
    // The backend now sends a single object with all the student's data
    const { enrolledCourses, learningStreak, achievements, recommendations, certificateCount } = data;
    // --- ✅ UPDATED SECTION END ---

    return (
    <div>
        {/* --- Student Stats Section --- */}
        <h2 className="mb-4">My Progress</h2>
        <Row className="mb-5 g-3">
            <Col md={4}><Card body className="text-center shadow-sm"><h4 className="fw-bold">🔥 {learningStreak} Day</h4><p className="text-muted mb-0">Learning Streak</p></Card></Col>
            <Col md={4}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{enrolledCourses.length}</h4><p className="text-muted mb-0">Courses Enrolled</p></Card></Col>
            {/* --- ✅ UPDATED SECTION START --- */}
            <Col md={4}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{certificateCount}</h4><p className="text-muted mb-0">Certificates Earned</p></Card></Col>
            {/* --- ✅ UPDATED SECTION END --- */}
        </Row>

        {/* --- Enrolled Courses Section --- */}
        <h2 className="mb-4">My Enrolled Courses</h2>
        {enrolledCourses.length > 0 ? (
            <Row>
                {enrolledCourses.map(enrollment => {
                    const progress = enrollment.total_lessons > 0 ? (enrollment.completed_lessons / enrollment.total_lessons) * 100 : 0;
                    const courseDetailLink = `/courses/${enrollment.course_id}`;
                    const resumeLink = enrollment.resumeLessonId ? `/courses/${enrollment.course_id}/lessons/${enrollment.resumeLessonId}` : courseDetailLink;
                    return (
                        <Col md={6} lg={4} key={enrollment.course_id} className="mb-4">
                            <Card className="h-100 shadow-sm">
                                <Link to={courseDetailLink}><Card.Img variant="top" src={enrollment.thumbnail_url || 'https://placehold.co/600x400'} style={{ height: '180px', objectFit: 'cover' }} /></Link>
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title as="h5" className="fw-bold">{enrollment.course_title}</Card.Title>
                                    <div className="mt-auto pt-3">
                                        <div className="d-flex justify-content-between text-muted small">
                                            <span>Progress</span>
                                            <span>{enrollment.completed_lessons} / {enrollment.total_lessons}</span>
                                        </div>
                                        <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mb-3" />
                                        <div className="d-flex gap-2">
                                            <Button as={Link} to={courseDetailLink} variant="outline-secondary" className="w-50">View</Button>
                                            <Button as={Link} to={resumeLink} variant="primary" className="w-50"><PlayCircleFill className="me-1" />{progress === 100 ? 'Review' : 'Resume'}</Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        ) : (
            <Alert variant="info">You are not yet enrolled in any courses. <Link to="/courses">Explore courses</Link> to get started!</Alert>
        )}

        {/* --- Achievements Section --- */}
        <div className="my-5">
            <h2 className="mb-4">Badges Earned</h2>
            {achievements.length > 0 ? (
                <Row>
                    {achievements.map(achId => {
                        const achievement = achievementMap[achId];
                        if (!achievement) return null;
                        return (
                            <Col md={4} key={achId} className="mb-3">
                                <Card body className="d-flex align-items-center" style={{ color: achievement.color, borderLeft: `5px solid ${achievement.color}` }}>
                                    <span className="fs-3 me-3">{achievement.icon}</span>
                                    <span className="fw-bold">{achievement.title}</span>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            ) : <Alert variant="light">Complete your first course to unlock achievements!</Alert>}
        </div>

        {/* --- Recommendations Section --- */}
        <div className="my-5">
             <h2 className="mb-4">Recommended For You</h2>
             {recommendations.length > 0 ? (
                 <Row>
                     {recommendations.map(course => (
                         <Col md={4} key={course.id} className="mb-3">
                              <Card className="h-100 shadow-sm">
                                  <Link to={`/courses/${course.id}`}><Card.Img variant="top" src={course.thumbnail_url || 'https://placehold.co/600x400'} style={{ height: '180px', objectFit: 'cover' }} /></Link>
                                  <Card.Body>
                                      <Card.Title as="h5" className="fw-bold">{course.title}</Card.Title>
                                      <Button as={Link} to={`/courses/${course.id}`} variant="outline-primary" className="mt-3">View Course</Button>
                                  </Card.Body>
                              </Card>
                         </Col>
                     ))}
                 </Row>
             ) : <Alert variant="light">Enroll in a few courses to get personalized recommendations.</Alert>}
        </div>
    </div>
    );
};


// --- The Final, Upgraded Instructor Dashboard Component ---
// --- The Final, Upgraded Instructor Dashboard Component ---
const InstructorDashboard = ({ data }) => {
    const [courses, setCourses] = useState(data);

    useEffect(() => { setCourses(data); }, [data]);

    // Add these missing handler functions
    const handleDelete = async (courseId) => {
        const token = localStorage.getItem('token');
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        
        try {
            await axios.delete(`${API_URL}/api/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove the deleted course from state
            setCourses(prev => prev.filter(course => course.course_id !== courseId));
            alert('Course deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete course');
        }
    };

    const handleStatusToggle = async (courseId, currentStatus) => {
        const token = localStorage.getItem('token');
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        
        try {
            await axios.patch(`${API_URL}/api/courses/${courseId}/status`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update the course status in state
            setCourses(prev => prev.map(course => 
                course.course_id === courseId 
                    ? { ...course, status: newStatus }
                    : course
            ));
            alert(`Course ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
        } catch (error) {
            console.error('Status update error:', error);
            alert('Failed to update course status');
        }
    };

    const totalCourses = courses.length;
    const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrollment_count || 0), 0);
    const totalCompletions = courses.reduce((sum, course) => sum + (course.completion_count || 0), 0);
    const totalLessons = courses.reduce((sum, course) => sum + (course.lesson_count || 0), 0);
    const overallCompletionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

    return (
        <div>
            <h2 className="mb-4">Teaching Analytics</h2>
            <Row className="mb-5 g-3">
                <Col lg={3} md={6}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{totalCourses}</h4><p className="text-muted mb-0">Total Courses</p></Card></Col>
                <Col lg={3} md={6}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{totalEnrollments}</h4><p className="text-muted mb-0">Total Enrollments</p></Card></Col>
                <Col lg={3} md={6}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{totalLessons}</h4><p className="text-muted mb-0">Total Lessons</p></Card></Col>
                <Col lg={3} md={6}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{overallCompletionRate.toFixed(1)}%</h4><p className="text-muted mb-0">Completion Rate</p></Card></Col>
            </Row>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>My Courses</h2>
                <Button as={Link} to="/create-course" variant="primary">Create New Course</Button>
            </div>
            
            <Row>
                {courses.map(course => {
                    const completionRate = course.enrollment_count > 0 ? (course.completion_count / course.enrollment_count) * 100 : 0;
                    return (
                        <Col md={6} lg={4} key={course.course_id} className="mb-4">
                            <Card className="h-100 shadow-sm">
                                <Card.Img variant="top" src={course.thumbnail_url || 'https://placehold.co/600x400'} style={{ height: '180px', objectFit: 'cover' }} />
                                <Card.Body>
                                    <Card.Title as="h5" className="fw-bold">{course.course_title}</Card.Title>
                                    
                                    {/* Status Badge */}
                                    <div className="mb-2">
                                        <span className={`badge ${course.status === 'published' ? 'bg-success' : 'bg-secondary'}`}>
                                            {course.status === 'published' ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                    
                                    <div className="d-flex justify-content-between text-muted small mb-2">
                                        <span><PeopleFill className="me-1" /> {course.enrollment_count} Enrolled</span>
                                        <span><PatchCheckFill className="me-1" /> {course.completion_count} Completed</span>
                                    </div>
                                    <ProgressBar now={completionRate} label={`${Math.round(completionRate)}%`} variant="success" style={{height: '10px'}}/>
                                </Card.Body>
                                <Card.Footer className="bg-white border-0 p-3">
                                    {/* Updated: Multiple action buttons */}
                                    <div className="d-grid gap-2">
                                        <Button as={Link} to={`/manage-course/${course.course_id}`} variant="primary" size="sm">
                                            Manage Lessons
                                        </Button>
                                        <div className="d-flex gap-2">
                                            <Button 
                                                as={Link} 
                                                to={`/edit-course/${course.course_id}`} 
                                                variant="outline-secondary" 
                                                size="sm"
                                                className="flex-fill"
                                            >
                                                Edit
                                            </Button>
                                            <Button 
                                                onClick={() => handleStatusToggle(course.course_id, course.status)}
                                                variant={course.status === 'published' ? 'outline-warning' : 'outline-success'}
                                                size="sm"
                                                className="flex-fill"
                                            >
                                                {course.status === 'published' ? 'Unpublish' : 'Publish'}
                                            </Button>
                                        </div>
                                        <Button 
                                            onClick={() => handleDelete(course.course_id)}
                                            variant="outline-danger" 
                                            size="sm"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

// --- Main Dashboard Page Component (No changes needed) ---
function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, isAuthLoading } = useContext(AuthContext);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) { setLoading(false); return; }

        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
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
    
    if (!user) {
        return (
            <Container className="my-5 text-center">
                <Alert variant="warning">Please <Link to="/login">log in</Link> to view your dashboard.</Alert>
            </Container>
        )
    }

    if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!dashboardData) return <Container className="text-center my-5"><p>Loading dashboard...</p></Container>;

    return (
        <Container className="my-5">
            <h1 className="mb-5">Welcome to your Dashboard, {user?.username}!</h1>
            {user?.role === 'student' ? (
                <StudentDashboard data={dashboardData} />
            ) : user?.role === 'instructor' ? (
                <InstructorDashboard data={dashboardData} />
            ) : (
                <p>Your dashboard is being prepared. Please check back later.</p>
            )}
        </Container>
    );
}

export default Dashboard;