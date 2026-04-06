import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';
import axios from 'axios';
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';

const Login = () => {
  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginMode === 'admin') {
        // Admin login
        const response = await axios.post(`${API_URL}/api/admin-auth/login`, {
          email,
          password
        });
        const { token, adminId, name } = response.data;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminId', adminId);
        localStorage.setItem('adminName', name);
        navigate('/admin');
      } else {
        // User login
        const response = await axios.post(`${API_URL}/api/auth/login`, {
          email,
          password
        });
        const { token } = response.data;
        localStorage.setItem('token', token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '100%', maxWidth: '450px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Welcome Back!</Card.Title>

          {/* Login Mode Toggle */}
          <div className="d-flex gap-2 mb-4">
            <Button
              variant={loginMode === 'user' ? 'primary' : 'outline-primary'}
              className="flex-grow-1"
              onClick={() => setLoginMode('user')}
            >
              User Login
            </Button>
            <Button
              variant={loginMode === 'admin' ? 'primary' : 'outline-primary'}
              className="flex-grow-1"
              onClick={() => setLoginMode('admin')}
            >
              Admin Login
            </Button>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>

          {loginMode === 'user' && (
            <div className="mt-3 text-center">
              <p className="text-muted small">Don't have an account? <Link to="/register">Sign up</Link></p>
            </div>
          )}

          {loginMode === 'admin' && (
            <div className="mt-3 text-center text-muted small">
              <p>Admin credentials are stored in MongoDB</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
