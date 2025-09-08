import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Book, PeopleFill } from 'react-bootstrap-icons';

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
              <Card className="h-100 course-card-new">
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

// --- Instructor Dashboard Component (Redesigned with Stats) ---
const InstructorDashboard = ({ data }) => {
  // Calculate teaching stats from the data
  const totalCourses = data.length;
  const totalStudents = data.reduce((sum, course) => sum + course.enrollment_count, 0);
  const totalLessons = data.reduce((sum, course) => sum + course.lesson_count, 0);

  return (
    <div>
      {/* --- Teaching Stats Section --- */}
      <h2 className="mb-4">Teaching Stats</h2>
      <Row className="mb-5">
        <Col md={4}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{totalCourses}</h4><p className="text-muted mb-0">Total Courses</p></Card></Col>
        <Col md={4}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{totalStudents}</h4><p className="text-muted mb-0">Total Enrollments</p></Card></Col>
        <Col md={4}><Card body className="text-center shadow-sm"><h4 className="fw-bold">{totalLessons}</h4><p className="text-muted mb-0">Total Lessons</p></Card></Col>
      </Row>

      {/* --- Created Courses Section --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Created Courses</h2>
        <Button as={Link} to="/create-course" variant="primary">Create New Course</Button>
      </div>
      {data.length > 0 ? (
        <Row>
          {data.map(course => (
            <Col md={6} lg={4} key={course.course_id} className="mb-4">
              <Card className="h-100 course-card-new">
                <Card.Body>
                  <Card.Title as="h5" className="fw-bold">{course.course_title}</Card.Title>
                  <div className="d-flex justify-content-between text-muted mt-3">
                    <span><Book className="me-2" />{course.lesson_count} Lessons</span>
                    <span><PeopleFill className="me-2" />{course.enrollment_count} Students</span>
                  </div>
                  <Button as={Link} to={`/manage-course/${course.course_id}`} variant="outline-primary" className="mt-4 w-100">
                    Manage Course
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <p>You have not created any courses yet. Click the button above to get started!</p>
      )}
    </div>
  );
};


// --- Main Dashboard Page (Updated to fix the reload bug) ---
function Dashboard() {
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, isAuthLoading } = useContext(AuthContext); // Use the new loading state from context

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Don't fetch if the auth check is still running or if there's no user
      if (isAuthLoading || !user) {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError("You must be logged in to view the dashboard.");
        return;
      }

      try {
        setLoading(true);
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
  }, [user, isAuthLoading]); // Re-run when the authentication status changes

  // Show a spinner while the initial authentication check is happening
  if (isAuthLoading) {
    return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
  }
  
  // After the auth check, if there is still no user, show a login prompt
  if (!user) {
      return (
          <Container className="my-5 text-center">
              <Alert variant="warning">Please <Link to="/login">log in</Link> to view your dashboard.</Alert>
          </Container>
      )
  }

  // Show a spinner for the dashboard-specific data loading
  if (loading) {
    return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
  }

  if (error) {
    return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container className="my-5">
      <h1 className="mb-5">Welcome to your Dashboard, {user?.name}!</h1>
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

