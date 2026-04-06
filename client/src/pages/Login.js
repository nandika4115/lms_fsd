import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Form, Button, Alert, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import logo from './logo.png';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

function Login() {
  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'admin'
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }
    try {
      if (loginMode === 'user') {
        // User login
        const res = await axios.post(`${API_URL}/api/auth/login`, formData);
        if (res.data.token) {
          login(res.data.token);
          navigate('/dashboard');
        }
      } else {
        // Admin login
        const res = await axios.post(`${API_URL}/api/admin-auth/login`, formData);
        if (res.data.token) {
          localStorage.setItem('adminToken', res.data.token);
          localStorage.setItem('adminId', res.data.adminId);
          localStorage.setItem('adminName', res.data.adminName);
          navigate('/admin');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid login credentials.");
    }
  };

  return (
    <div className="login-container" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left Half - Logo Background */}
      <div className="left-section" style={{
        flex: '1',
        backgroundImage: `url(${logo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      </div>

      {/* Right Half - Gradient Background with Login Card */}
      <div className="right-section" style={{
        flex: '1',
        background: 'radial-gradient(ellipse at center, #ffffff 0%, #e8f0fe 40%, #a8c8e1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        {/* Floating Login Card */}
        <div className="login-card" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Toggle Tabs */}
          <div className="mb-4 d-flex gap-2">
            <Button 
              variant={loginMode === 'user' ? 'primary' : 'light'}
              onClick={() => setLoginMode('user')}
              className="flex-grow-1"
              style={{ borderRadius: '10px', fontWeight: '600' }}
            >
              User Login
            </Button>
            <Button 
              variant={loginMode === 'admin' ? 'primary' : 'light'}
              onClick={() => setLoginMode('admin')}
              className="flex-grow-1"
              style={{ borderRadius: '10px', fontWeight: '600' }}
            >
              Admin Login
            </Button>
          </div>

          <h2 className="text-center mb-2">
            {loginMode === 'user' ? 'Welcome Back!' : 'Admin Portal'}
          </h2>
          <p className="text-muted mb-4 text-center">
            {loginMode === 'user' ? 'Please login to your account.' : 'Enter your admin credentials.'}
          </p>
          
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  borderRadius: '10px',
                  border: '1px solid #e0e0e0',
                  padding: '12px'
                }}
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
                style={{
                  borderRadius: '10px',
                  border: '1px solid #e0e0e0',
                  padding: '12px'
                }}
              />
            </Form.Group>
            
            {loginMode === 'user' && (
              <div className="text-end mb-3">
                <a href="#!" className="text-decoration-none">Forgot Password?</a>
              </div>
            )}

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 py-2"
              style={{
                borderRadius: '10px',
                padding: '12px',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
              }}
            >
              {loginMode === 'user' ? 'Login' : 'Admin Login'}
            </Button>

            {loginMode === 'user' && (
              <div className="mt-4 text-center">
                <span className="text-muted">Don't have an account? </span>
                <Link to="/register" className="fw-bold text-decoration-none">Sign up</Link>
              </div>
            )}
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Login;

