import React, { useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import logo from './edulearnpro-logo.png'; // Using the logo you downloaded

const API_URL = "http://localhost:5000";

function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      alert("Email and password required");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      alert(res.data.message);
      setFormData({ username: "", password: "" });
    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.message || "Invalid login");
    }
  };

  return (
    <Container fluid>
      <Row className="min-vh-100">
        
        {/* Left Column with Branding (The style you liked) */}
        <Col md={6} className="bg-light d-none d-md-flex flex-column justify-content-center align-items-center">
            <div className="text-center p-5">
                <img src={logo} alt="EduLearnPro Logo" style={{ width: '150px' }} className="mb-4"/>
                <h1 className="text-primary">EduLearnPro</h1>
                <p className="lead">
                Pursue real career paths through instructor-led courses taught by experts.
                </p>
            </div>
        </Col>

        {/* Right Column with Centered Form */}
        <Col md={6} className="d-flex justify-content-center align-items-center">
          <div style={{ maxWidth: '400px', width: '100%' }} className="p-4">
            <div className="text-center mb-4">
                <h2>Welcome!</h2>
            </div>
            <p className="text-muted mb-4 text-center">Please login to your account.</p>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Control
                  type="email"
                  name="username"
                  placeholder="Email"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Password"
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
                  <span className="mx-2 text-muted small">OR</span>
                  <hr className="flex-grow-1" />
              </div>
              
              <Button variant="outline-secondary" className="w-100 d-flex justify-content-center align-items-center py-2">
                <img src="https://img.icons8.com/color/16/000000/google-logo.png" alt="Google icon" className="me-2"/>
                Continue with Google
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

