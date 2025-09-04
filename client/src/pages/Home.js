import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Image, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = "http://localhost:5000";

const cardColors = ['#4DB6AC', '#7986CB', '#FFB74D', '#F06292', '#9575CD'];

function FeaturedCourses() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/courses`);
        setCourses(response.data.slice(0, 3));
      } catch (error) {
        console.error("Could not fetch featured courses:", error);
      }
    };
    fetchFeaturedCourses();
  }, []);

  return (
    <div className="py-5">
      <Container>
        <h2 className="text-center fw-bold mb-5">Featured Courses</h2>
        <Row>
          {courses.map((course, index) => (
            <Col md={6} lg={4} key={course.id} className="mb-4">
              <Card 
                className="h-100 course-card rounded-4 shadow-sm" 
                style={{ borderTop: `5px solid ${cardColors[index % cardColors.length]}` }}
              >
                <Card.Img 
                  variant="top" 
                  src={`https://placehold.co/600x400/${cardColors[index % cardColors.length].substring(1)}/FFFFFF?text=${course.title.replace(/\s/g, '+')}`}
                  className="course-card-img"
                />
                <Card.Body className="d-flex flex-column p-4">
                  <Card.Title as="h5" className="fw-bold">{course.title}</Card.Title>
                  <Card.Text className="course-card-text">{course.description}</Card.Text>
                  <Button as={Link} to={`/courses/${course.id}`} variant="primary" className="mt-auto align-self-start">
                    Learn More
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}

function HomePage() {
  return (
    <>
      <div className="hero-section text-white text-center">
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <h1 className="display-3 fw-bolder">Unlock Your Potential</h1>
              <p className="lead my-4">
                Join a community of learners and experts. Start your journey with EduLearnPro today and take your skills to the next level.
              </p>
              <Button as={Link} to="/courses" variant="light" size="lg">
                Explore Courses
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      {/* ✨ Added a wrapper div with a new class for styling ✨ */}
      <div className="content-section-wrapper">
        <FeaturedCourses />

        <div className="about-section">
          <Container className="my-5 py-5">
            <Row className="align-items-center" id="about-us">
              <Col md={6} className="mb-4 mb-md-0">
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                  rounded
                  fluid
                  className="shadow-lg"
                  alt="Students collaborating and learning together"
                />
              </Col>
              <Col md={6}>
                <h2 className="fw-bold">About EduLearnPro</h2>
                <p className="text-muted">
                  We believe in a world where anyone, anywhere has the power to transform their life through learning. Our courses are curated and taught by industry experts who are passionate about sharing their knowledge.
                </p>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      <div className="cta-section text-center py-5">
          <Container>
              <h2 className="fw-bold">Ready to Start Learning?</h2>
              <p className="text-muted my-3">Create an account to enroll in courses, track your progress, and join our community.</p>
              <Button as={Link} to="/register" variant="success" size="lg">
                  Sign Up for Free
              </Button>
          </Container>
      </div>
    </>
  );
}

export default HomePage;

