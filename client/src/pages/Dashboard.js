import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Row, Col, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Make sure the user is loaded before fetching
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const response = await axios.get(`${API_URL}/api/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setDashboardData(response.data);
        setError('');
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.response?.data?.message || "Could not load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]); // Re-run the effect if the user object changes

  // --- Render Functions ---

  const renderStudentDashboard = () => (
    <>
      <h2 className="mb-4">My Enrolled Courses</h2>
      {dashboardData.length > 0 ? (
        <Row>
          {dashboardData.map(course => (
            <Col md={6} lg={4} key={course.course_id} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>{course.course_title}</Card.Title>
                  <Card.Text>
                    Your Progress:
                    <ProgressBar 
                      now={(course.completed_lessons / course.total_lessons) * 100} 
                      label={`${course.completed_lessons} / ${course.total_lessons} lessons`} 
                      className="mt-2"
                    />
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <p>You are not enrolled in any courses yet.</p>
      )}
    </>
  );

  const renderInstructorDashboard = () => (
    <>
      <h2 className="mb-4">My Created Courses</h2>
       {dashboardData.length > 0 ? (
        <Row>
          {dashboardData.map(course => (
            <Col md={6} lg={4} key={course.course_id} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>{course.course_title}</Card.Title>
                  <Card.Text>
                    <strong>{course.enrollment_count}</strong> Students Enrolled
                    <br />
                    <strong>{course.lesson_count}</strong> Lessons
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <p>You have not created any courses yet.</p>
      )}
    </>
  );


  // --- Main Return Logic ---

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h1 className="text-center mb-5">Dashboard</h1>
      {user?.role === 'student' && renderStudentDashboard()}
      {user?.role === 'instructor' && renderInstructorDashboard()}
    </Container>
  );
}

export default Dashboard;

