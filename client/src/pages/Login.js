import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import logo from './edulearnpro-logo.png';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

function Login() {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState(''); // State to hold error messages
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors on a new submission
    if (!formData.identifier || !formData.password) {
      setError("Username/Email and password are required");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      
      if (res.data.token) {
        login(res.data.token);
        navigate('/'); // Redirect to homepage on successful login
      }

    } catch (err) {
      console.error("Login error:", err);
      // Display the error message from the backend on the page
      setError(err.response?.data?.message || "Invalid login credentials.");
    }
  };

  return (
    <Container fluid>
      <Row className="min-vh-100">
        <Col md={6} className="bg-light d-none d-md-flex flex-column justify-content-center align-items-center">
          <div className="text-center">
            <img src={logo} alt="EduLearnPro Logo" style={{ width: '150px' }} className="mb-4"/>
            <h1 className="text-primary">EduLearnPro</h1>
            <p className="lead">Pursue real career paths through instructor-led courses taught by experts.</p>
          </div>
        </Col>

        <Col md={6} className="d-flex justify-content-center align-items-center">
          <div style={{ maxWidth: '400px', width: '100%' }} className="p-4">
            <h2 className="text-center">Welcome Back!</h2>
            <p className="text-muted mb-4 text-center">Please login to your account.</p>
            <Form onSubmit={handleSubmit}>
              {/* Display error message if one exists */}
              {error && <Alert variant="danger">{error}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label>Username or Email</Form.Label>
                <Form.Control
                  type="text"
                  name="identifier"
                  placeholder="Enter your username or email"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              
              <div className="text-end mb-3">
                 <a href="#!" className="text-decoration-none">Forgot Password?</a>
              </div>

              <Button variant="primary" type="submit" className="w-100 py-2">
                Login
              </Button>
              
              <div className="d-flex align-items-center my-4">
                  <hr className="flex-grow-1" />
                  <span className="mx-2 text-muted">Or continue with</span>
                  <hr className="flex-grow-1" />
              </div>
              
              <Button variant="outline-secondary" className="w-100 d-flex justify-content-center align-items-center py-2">
                <img src="https://img.icons8.com/color/16/000000/google-logo.png" alt="Google icon" className="me-2"/>
                Google
              </Button>

              <div className="mt-4 text-center">
                <span className="text-muted">Don't have an account? </span>
                <Link to="/register" className="fw-bold text-decoration-none">Sign up</Link>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;

