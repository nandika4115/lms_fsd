import React from 'react';
// ✨ FIX: Added 'Nav' to the import list
import { Container, Row, Col, Form, Button, ListGroup, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { GeoAltFill, TelephoneFill, EnvelopeFill } from 'react-bootstrap-icons';

function ContactPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for your message! (This is a demo and does not send emails.)");
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center text-center">
        <Col md={8}>
          <h1 className="mb-4">Get in Touch</h1>
          <p className="lead text-muted mb-5">
            We'd love to hear from you. Whether you have a question about courses, pricing, or anything else, our team is ready to answer all your questions.
          </p>
        </Col>
      </Row>

      <Row>
        {/* Left Side: Contact Form */}
        <Col md={7} className="mb-4 mb-md-0">
          <h3 className="mb-4">Send us a Message</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formGroupName">
              <Form.Label>Full Name</Form.Label>
              <Form.Control type="text" placeholder="Enter your name" required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formGroupEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control type="email" placeholder="Enter your email" required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formGroupMessage">
              <Form.Label>Message</Form.Label>
              <Form.Control as="textarea" rows={5} placeholder="Your message" required />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              Submit
            </Button>
          </Form>
        </Col>

        {/* Right Side: Contact Info */}
        <Col md={5}>
          <h3 className="mb-4">Contact Information</h3>
          <ListGroup variant="flush">
            <ListGroup.Item className="d-flex align-items-start border-0">
              <GeoAltFill size={20} className="me-3 text-primary mt-1" />
              <div>
                <strong>Address:</strong><br />
                123 Learning Lane, Knowledge City, 560100
              </div>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex align-items-start border-0">
              <TelephoneFill size={20} className="me-3 text-primary mt-1" />
              <div>
                <strong>Phone:</strong><br />
                +91 98765 43210
              </div>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex align-items-start border-0">
              <EnvelopeFill size={20} className="me-3 text-primary mt-1" />
              <div>
                <strong>Email:</strong><br />
                support@edulearnpro.com
              </div>
            </ListGroup.Item>
          </ListGroup>
        </Col>
      </Row>

      <hr className="my-5" />

      {/* Quick Links Section */}
      <Row className="text-center">
        <h3 className="mb-4">Quick Links</h3>
        <Col md={4} className="mb-3">
          <h5>Navigation</h5>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/courses">Explore Courses</Nav.Link>
          </Nav>
        </Col>
        <Col md={4} className="mb-3">
          <h5>Account</h5>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/login">Login</Nav.Link>
            <Nav.Link as={Link} to="/register">Register</Nav.Link>
            <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
          </Nav>
        </Col>
        <Col md={4} className="mb-3">
          <h5>Company</h5>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/#about-us">About Us</Nav.Link>
            <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
          </Nav>
        </Col>
      </Row>
    </Container>
  );
}

export default ContactPage;

