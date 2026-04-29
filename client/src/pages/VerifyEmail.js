import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Alert, Button, Form, Spinner } from 'react-bootstrap';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { EnvelopeCheck, CheckCircleFill, XCircleFill, ArrowRepeat } from 'react-bootstrap-icons';
import API_URL from '../config';

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState('idle'); // idle | verifying | success | error | resend
    const [message, setMessage] = useState('');
    const [resendEmail, setResendEmail] = useState('');
    const [resendStatus, setResendStatus] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [debugInfo, setDebugInfo] = useState('');

    // If there's a token in the URL, verify it
    useEffect(() => {
        if (token) {
            setStatus('verifying');
            setDebugInfo(`API URL: ${API_URL}`);
            console.log('Starting verification with token:', token);
            console.log('API URL:', API_URL);
            
            axios.get(`${API_URL}/api/auth/verify-email?token=${token}`, { timeout: 10000 })
                .then(res => {
                    console.log('Verification successful:', res.data);
                    setStatus('success');
                    setMessage(res.data.message);
                    setDebugInfo('');
                })
                .catch(err => {
                    console.error('Verification error:', err);
                    setStatus('error');
                    const errorMsg = err.response?.data?.message || 
                                    err.message || 
                                    'Verification failed. The backend server may not be running.';
                    setMessage(errorMsg);
                    
                    // Debug info
                    if (err.code === 'ECONNABORTED') {
                        setDebugInfo('Request timeout - Backend server is not responding');
                    } else if (err.code === 'ECONNREFUSED') {
                        setDebugInfo('Connection refused - Backend server is not running');
                    } else {
                        setDebugInfo(`Error: ${err.code || 'Unknown error'}`);
                    }
                });
        }
    }, [token]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleResend = async (e) => {
        e.preventDefault();
        if (!resendEmail) return;

        try {
            setResendStatus('sending');
            await axios.post(`${API_URL}/api/auth/resend-verification`, { email: resendEmail });
            setResendStatus('sent');
            setCountdown(60);
        } catch (err) {
            setResendStatus('error');
        }
    };

    // Token verification view
    if (token) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div className="verify-email-card text-center" style={{
                    background: 'rgba(255,255,255,0.97)',
                    borderRadius: '24px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                    padding: '50px 40px',
                    maxWidth: '480px',
                    width: '100%'
                }}>
                    {status === 'verifying' && (
                        <>
                            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                            <h3 className="mt-4">Verifying your email...</h3>
                            <p className="text-muted">Please wait a moment.</p>
                            {debugInfo && (
                                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '20px' }}>
                                    <small>{debugInfo}</small>
                                </p>
                            )}
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <div className="verify-success-icon" style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #00C853, #00E676)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px',
                                boxShadow: '0 8px 30px rgba(0,200,83,0.3)',
                                animation: 'scaleIn 0.5s ease-out'
                            }}>
                                <CheckCircleFill size={40} color="white" />
                            </div>
                            <h3 style={{ color: '#2e7d32' }}>Email Verified! ✅</h3>
                            <p className="text-muted mt-2 mb-4">{message}</p>
                            <Button
                                as={Link}
                                to="/login"
                                variant="primary"
                                size="lg"
                                style={{
                                    borderRadius: '12px', padding: '12px 40px',
                                    fontWeight: '600',
                                    background: 'linear-gradient(135deg, #00796B, #004D40)',
                                    border: 'none',
                                    boxShadow: '0 4px 15px rgba(0,77,64,0.3)'
                                }}
                            >
                                Go to Login
                            </Button>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #ef5350, #e53935)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px',
                                boxShadow: '0 8px 30px rgba(229,57,53,0.3)'
                            }}>
                                <XCircleFill size={40} color="white" />
                            </div>
                            <h3 style={{ color: '#c62828' }}>Verification Failed</h3>
                            <p className="text-muted mt-2 mb-4">{message}</p>
                            {debugInfo && (
                                <Alert variant="warning" className="mt-3 mb-3">
                                    <small><strong>Debug Info:</strong> {debugInfo}</small>
                                </Alert>
                            )}
                            <Button
                                variant="outline-primary"
                                onClick={() => { setStatus('idle'); navigate('/verify-email'); }}
                                style={{ borderRadius: '12px', padding: '10px 30px', fontWeight: '600' }}
                            >
                                <ArrowRepeat className="me-2" /> Request New Link
                            </Button>
                        </>
                    )}
                </div>
            </Container>
        );
    }

    // Default view: "Check your email" + resend form
    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <div className="verify-email-card text-center" style={{
                background: 'rgba(255,255,255,0.97)',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                padding: '50px 40px',
                maxWidth: '500px',
                width: '100%'
            }}>
                <div style={{
                    width: '90px', height: '90px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #42A5F5, #1E88E5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px',
                    boxShadow: '0 8px 30px rgba(30,136,229,0.3)',
                    animation: 'pulse 2s ease-in-out infinite'
                }}>
                    <EnvelopeCheck size={42} color="white" />
                </div>

                <h2 style={{ fontWeight: '700', color: '#333', marginBottom: '12px' }}>Check Your Email</h2>
                <p className="text-muted" style={{ fontSize: '16px', lineHeight: '1.6' }}>
                    We've sent a verification link to your email address. Please click the link to verify your account and start learning!
                </p>

                <hr className="my-4" />

                <p className="text-muted mb-3" style={{ fontSize: '14px' }}>
                    Didn't receive the email? Enter your address to resend.
                </p>

                <Form onSubmit={handleResend}>
                    <Form.Group className="mb-3">
                        <Form.Control
                            type="email"
                            placeholder="Enter your email address"
                            value={resendEmail}
                            onChange={(e) => setResendEmail(e.target.value)}
                            required
                            style={{
                                borderRadius: '10px', border: '1px solid #e0e0e0',
                                padding: '12px', textAlign: 'center'
                            }}
                        />
                    </Form.Group>
                    <Button
                        type="submit"
                        variant="outline-primary"
                        className="w-100"
                        disabled={countdown > 0 || resendStatus === 'sending'}
                        style={{ borderRadius: '10px', padding: '10px', fontWeight: '600' }}
                    >
                        {resendStatus === 'sending' ? (
                            <><Spinner size="sm" animation="border" className="me-2" /> Sending...</>
                        ) : countdown > 0 ? (
                            `Resend in ${countdown}s`
                        ) : (
                            'Resend Verification Email'
                        )}
                    </Button>
                </Form>

                {resendStatus === 'sent' && (
                    <Alert variant="success" className="mt-3" style={{ borderRadius: '10px' }}>
                        ✅ Verification email sent! Please check your inbox (and spam folder).
                    </Alert>
                )}

                <div className="mt-4">
                    <Link to="/login" className="text-decoration-none fw-bold">← Back to Login</Link>
                </div>
            </div>
        </Container>
    );
}

export default VerifyEmail;
