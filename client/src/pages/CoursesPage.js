import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = "http://localhost:5000";

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/courses`);
        setCourses(response.data);
        setError('');
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setError("Could not load courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" />
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
      <h1 className="text-center mb-5">Explore Our Courses</h1>
      <Row>
        {courses.map(course => (
          <Col md={6} lg={4} key={course.id} className="mb-4">
            <Card className="h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title>{course.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  Taught by: {course.instructor_name}
                </Card.Subtitle>
                <Card.Text>{course.description}</Card.Text>
                {/* The Link component will navigate to a detail page we will build next */}
                <Button as={Link} to={`/courses/${course.id}`} variant="primary" className="mt-auto">
                  View Details
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default CoursesPage;
