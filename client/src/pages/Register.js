import React, { useState, useContext } from 'react';
import axios from "axios";
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

function Register() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        role: "student",
        phoneNumber: "",
        age: "",
        currentActivity: "Studying",
        activityPlace: ""
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/api/auth/register`, formData);

            // New flow: redirect to email verification page
            if (res.data.requiresVerification) {
                navigate('/verify-email');
                return;
            }

            // Fallback: if the server returned a token (shouldn't happen with new flow)
            if (res.data.token) {
                login(res.data.token);
                navigate('/');
            } else {
                navigate('/login');
            }

        } catch (err) {
            console.error("Registration error:", err);
            setError(err.response?.data?.message || "Something went wrong during registration.");
        }
        setLoading(false);
    };

    return (
        <Container fluid className="d-flex justify-content-center align-items-center min-vh-100 bg-light py-4">
            <div className="p-4 p-sm-5 bg-white rounded shadow-sm" style={{ maxWidth: '600px', width: '100%' }}>
                <h2 className="text-center mb-4">Create Your EduLearnPro Account</h2>
                <Form onSubmit={handleSubmit}>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Row className="mb-3">
                        <Col sm={6}>
                            <Form.Group>
                                <Form.Label>First Name <span style={{ color: 'red' }}>*</span></Form.Label>
                                <Form.Control type="text" name="firstName" placeholder="e.g., John" value={formData.firstName} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col sm={6}>
                            <Form.Group>
                                <Form.Label>Last Name <span style={{ color: 'red' }}>*</span></Form.Label>
                                <Form.Control type="text" name="lastName" placeholder="e.g., Doe" value={formData.lastName} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col sm={6}>
                            <Form.Group>
                                <Form.Label>Username <span style={{ color: 'red' }}>*</span></Form.Label>
                                <Form.Control type="text" name="username" placeholder="Your public display name" value={formData.username} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col sm={6}>
                            <Form.Group>
                                <Form.Label>Email Address <span style={{ color: 'red' }}>*</span></Form.Label>
                                <Form.Control type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Password <span style={{ color: 'red' }}>*</span></Form.Label>
                        <Form.Control type="password" name="password" placeholder="Create a strong password" value={formData.password} onChange={handleChange} required />
                    </Form.Group>
                    <hr />
                    <p className="text-muted">Optional Information</p>
                    <Row className="mb-3">
                        <Col sm={6}>
                            <Form.Group>
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control type="tel" name="phoneNumber" placeholder="(Optional)" value={formData.phoneNumber} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col sm={6}>
                            <Form.Group>
                                <Form.Label>Age</Form.Label>
                                <Form.Control type="number" name="age" placeholder="(Optional)" value={formData.age} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col sm={6}>
                            <Form.Group>
                                <Form.Label>Current Activity</Form.Label>
                                <Form.Select name="currentActivity" value={formData.currentActivity} onChange={handleChange}>
                                    <option value="Studying">Studying</option>
                                    <option value="Working">Working</option>
                                    <option value="Other">Other</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col sm={6}>
                            <Form.Group>
                                <Form.Label>Institution / Company</Form.Label>
                                <Form.Control type="text" name="activityPlace" placeholder="e.g., University of Code" value={formData.activityPlace} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-4">
                        <Form.Label>Register as a...</Form.Label>
                        <Form.Select name="role" value={formData.role} onChange={handleChange}>
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                        </Form.Select>
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 py-2" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>

                    <div className="mt-4 text-center">
                        <span className="text-muted">Already have an account? </span>
                        <Link to="/login" className="fw-bold text-decoration-none">Login</Link>
                    </div>
                </Form>
            </div>
        </Container>
    );
}

export default Register;
