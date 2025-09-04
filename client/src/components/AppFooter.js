import React, { useState } from 'react';
import { Container, Row, Col, Button, Modal, Form, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { GeoAltFill, TelephoneFill, EnvelopeFill } from 'react-bootstrap-icons';
import logo from '../pages/edulearnpro-logo.png'; // Make sure the path to your logo is correct

// --- Contact Form Modal ---
function ContactModal({ show, handleClose }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for your message! (This is a demo and does not send emails.)");
    handleClose(); // Close the modal on submit
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Send us a Message</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control type="text" placeholder="Enter your name" required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control type="email" placeholder="Enter your email" required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control as="textarea" rows={4} placeholder="Your message or report..." required />
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100">
            Submit
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}


// --- Main Footer Component ---
function AppFooter() {
  const [showModal, setShowModal] = useState(false);

  const handleModalClose = () => setShowModal(false);
  const handleModalShow = () => setShowModal(true);

  return (
    <>
      <footer className="bg-dark text-white pt-5 pb-4" id="footer-contact">
        <Container>
          <Row>
            <Col md={4} lg={3} className="mb-4">
              <img src={logo} alt="EduLearnPro" width="50" className="mb-3" />
              <h5 className="text-uppercase fw-bold">EduLearnPro</h5>
              <p className="text-white-50">
                Empowering individuals to achieve their career goals through accessible, high-quality education.
              </p>
            </Col>

            <Col md={2} lg={2} className="mb-4">
              <h6 className="text-uppercase fw-bold">Navigation</h6>
              <Nav className="flex-column">
                <Nav.Link as={Link} to="/" className="text-white-50 p-0 mb-2">Home</Nav.Link>
                <Nav.Link as={Link} to="/courses" className="text-white-50 p-0 mb-2">Courses</Nav.Link>
                <Nav.Link as={Link} to="/#about-us" className="text-white-50 p-0 mb-2">About Us</Nav.Link>
              </Nav>
            </Col>

            <Col md={3} lg={3} className="mb-4">
              <h6 className="text-uppercase fw-bold">Account</h6>
              <Nav className="flex-column">
                <Nav.Link as={Link} to="/login" className="text-white-50 p-0 mb-2">Login</Nav.Link>
                <Nav.Link as={Link} to="/profile" className="text-white-50 p-0 mb-2">Profile</Nav.Link>
                <Nav.Link as={Link} to="/dashboard" className="text-white-50 p-0 mb-2">Dashboard</Nav.Link>
              </Nav>
            </Col>

            <Col md={3} lg={4} className="mb-4">
              <h6 className="text-uppercase fw-bold">Contact</h6>
              <p className="text-white-50 mb-2"><GeoAltFill className="me-2" /> 123 Learning Lane, Knowledge City</p>
              <p className="text-white-50 mb-2"><EnvelopeFill className="me-2" /> support@edulearnpro.com</p>
              <p className="text-white-50 mb-2"><TelephoneFill className="me-2" /> +91 98765 43210</p>
              <Button variant="outline-light" size="sm" onClick={handleModalShow}>Message or Report</Button>
            </Col>
          </Row>
          <hr />
          <Row className="text-center text-white-50 justify-content-center">
            <Col lg={8}>
                <p>&copy; {new Date().getFullYear()} EduLearnPro. All Rights Reserved.</p>
            </Col>
          </Row>
        </Container>
      </footer>

      {/* Render the Contact Modal */}
      <ContactModal show={showModal} handleClose={handleModalClose} />
    </>
  );
}

export default AppFooter;

