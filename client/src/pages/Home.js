import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

function Home() {
  const courses = [
    { id: 1, title: "Web Development", description: "Learn to build modern websites." },
    { id: 2, title: "Data Science", description: "Explore data analysis and machine learning." },
    { id: 3, title: "UI/UX Design", description: "Design beautiful and intuitive interfaces." }
  ];

  return (
    <Container className="my-5">
      <div className="text-center mb-5">
        <h1>Welcome to EduLearnPro</h1>
        <p className="text-muted">Your journey to knowledge starts here.</p>
      </div>
      
      <h2 className="text-center mb-4">Our Courses</h2>
      <Row className="justify-content-center">
        {courses.map(course => (
          <Col md={4} key={course.id} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>{course.title}</Card.Title>
                <Card.Text>{course.description}</Card.Text>
                <Button variant="primary">Enroll Now</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Home;