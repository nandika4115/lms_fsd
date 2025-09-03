import React, { useState } from "react";
import axios from "axios";
import { Container, Form, Button } from 'react-bootstrap';

// Your API_URL constant from before
const API_URL = "http://localhost:5000"; 

function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });

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
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      alert(res.data.message);
      setFormData({ username: "", password: "" });
    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.message || "Invalid login");
    }
  };

  return (
    <Container className="my-5">
      <h2 className="text-center mb-4">Login</h2>
      <Form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: '400px' }}>
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Control
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="w-100">
          Login
        </Button>
      </Form>
    </Container>
  );
}

export default Login;