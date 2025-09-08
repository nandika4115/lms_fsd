import React, { useState } from 'react';
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = "http://localhost:5000";

function CreateCoursePage() {
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError("You must be logged in to create a course.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/courses`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`${response.data.message} You will be redirected to the dashboard.`);
      
      // Redirect back to the dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error("Course creation failed:", err);
      setError(err.response?.data?.message || "An error occurred while creating the course.");
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="p-4">
            <h1 className="text-center mb-4">Create a New Course</h1>
            <Form onSubmit={handleSubmit}>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label>Course Title</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  placeholder="e.g., Introduction to React"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Course Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="description"
                  placeholder="Describe what students will learn in this course."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <div className="d-grid gap-2">
                <Button variant="primary" type="submit">
                  Create Course
                </Button>
                <Button as={Link} to="/dashboard" variant="secondary">
                  Cancel
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CreateCoursePage;

