import React, { useState } from "react";
import axios from "axios";
import { Container, Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate

const API_URL = "http://localhost:5000";

function Register() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate(); // Hook for navigation

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      alert("Username and password required");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, formData);
      alert(res.data.message);
      setFormData({ username: "", password: "" });
      // On successful registration, navigate to the login page
      navigate('/login');
    } catch (err) {
      console.error("Registration error:", err);
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    // min-vh-100: Sets the container height to 100% of the viewport
    // d-flex, justify-content-center, align-items-center: Centers the content
    <Container fluid className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      {/* Form Wrapper with styling */}
      <div className="p-4 p-sm-5 bg-white rounded shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Create Account</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              type="email" // Using type="email" is good practice for usernames that are emails
              name="username"
              placeholder="Email"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Control
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </Form.Group>

          {/* w-100: Makes button full width. py-2: Adds vertical padding */}
          <Button variant="primary" type="submit" className="w-100 py-2">
            Register
          </Button>

          {/* mt-3: margin-top. text-center: centers the text */}
          <div className="mt-4 text-center">
            <span className="text-muted">Already have an account? </span>
            {/* fw-bold: Font weight bold. text-decoration-none: Removes underline */}
            <Link to="/login" className="fw-bold text-decoration-none">Login</Link>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default Register;