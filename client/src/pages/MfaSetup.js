import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Container, Button, Alert, Spinner, Form } from 'react-bootstrap';
import { ShieldLock, QrCodeScan, CheckCircleFill, ClipboardCheck } from 'react-bootstrap-icons';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

function MfaSetup() {
    const { user } = useContext(AuthContext);
    const [step, setStep] = useState('intro'); // intro | qr | backup | done
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedCodes, setCopiedCodes] = useState(false);

    const token = localStorage.getItem('token');

    const handleInitSetup = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_URL}/api/auth/setup-mfa`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQrCode(res.data.qrCode);
            setSecret(res.data.secret);
            setStep('qr');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initialize MFA setup.');
        }
        setLoading(false);
    };

    const handleConfirm = async (e) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError('Please enter a 6-digit code.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_URL}/api/auth/confirm-mfa`, { code }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBackupCodes(res.data.backupCodes);
            setStep('backup');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid code. Please try again.');
        }
        setLoading(false);
    };

    const copyBackupCodes = () => {
        const codesText = backupCodes.join('\n');
        navigator.clipboard.writeText(codesText);
        setCopiedCodes(true);
        setTimeout(() => setCopiedCodes(false), 3000);
    };

    return (
        <Container className="py-5 d-flex justify-content-center">
            <div style={{
                background: 'rgba(255,255,255,0.97)',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                padding: '40px',
                maxWidth: '520px',
                width: '100%'
            }}>
                {/* Step 1: Introduction */}
                {step === 'intro' && (
                    <div className="text-center">
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1a237e, #283593)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 28px',
                            boxShadow: '0 8px 30px rgba(26,35,126,0.3)'
                        }}>
                            <ShieldLock size={36} color="white" />
                        </div>
                        <h3 style={{ fontWeight: '700' }}>Enable Two-Factor Authentication</h3>
                        <p className="text-muted mt-3" style={{ lineHeight: '1.7' }}>
                            Add an extra layer of security to your account. You'll need an authenticator app like
                            <strong> Google Authenticator</strong> or <strong>Authy</strong> on your phone.
                        </p>

                        <div style={{
                            background: '#f5f7ff', borderRadius: '16px', padding: '20px',
                            margin: '24px 0', textAlign: 'left'
                        }}>
                            <h6 className="fw-bold mb-3">How it works:</h6>
                            <div className="d-flex align-items-start mb-2">
                                <span style={{
                                    background: '#283593', color: 'white', borderRadius: '50%',
                                    width: '24px', height: '24px', minWidth: '24px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '12px', fontWeight: '700', marginRight: '12px', marginTop: '2px'
                                }}>1</span>
                                <span>Scan a QR code with your authenticator app</span>
                            </div>
                            <div className="d-flex align-items-start mb-2">
                                <span style={{
                                    background: '#283593', color: 'white', borderRadius: '50%',
                                    width: '24px', height: '24px', minWidth: '24px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '12px', fontWeight: '700', marginRight: '12px', marginTop: '2px'
                                }}>2</span>
                                <span>Enter the 6-digit code to confirm</span>
                            </div>
                            <div className="d-flex align-items-start">
                                <span style={{
                                    background: '#283593', color: 'white', borderRadius: '50%',
                                    width: '24px', height: '24px', minWidth: '24px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '12px', fontWeight: '700', marginRight: '12px', marginTop: '2px'
                                }}>3</span>
                                <span>Save your backup codes in a safe place</span>
                            </div>
                        </div>

                        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

                        <Button
                            onClick={handleInitSetup}
                            disabled={loading}
                            size="lg"
                            className="w-100"
                            style={{
                                borderRadius: '12px', padding: '14px',
                                fontWeight: '600',
                                background: 'linear-gradient(135deg, #1a237e, #283593)',
                                border: 'none',
                                boxShadow: '0 4px 15px rgba(26,35,126,0.3)'
                            }}
                        >
                            {loading ? <Spinner size="sm" animation="border" className="me-2" /> : <ShieldLock className="me-2" />}
                            Get Started
                        </Button>
                    </div>
                )}

                {/* Step 2: QR Code + Verification */}
                {step === 'qr' && (
                    <div className="text-center">
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00796B, #004D40)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px',
                            boxShadow: '0 6px 20px rgba(0,77,64,0.25)'
                        }}>
                            <QrCodeScan size={28} color="white" />
                        </div>
                        <h4 className="fw-bold">Scan This QR Code</h4>
                        <p className="text-muted mb-3">Open your authenticator app and scan the code below.</p>

                        <div style={{
                            background: '#ffffff', border: '2px solid #e0e0e0',
                            borderRadius: '16px', padding: '20px',
                            display: 'inline-block', margin: '0 auto 20px'
                        }}>
                            {qrCode && <img src={qrCode} alt="MFA QR Code" style={{ width: '200px', height: '200px' }} />}
                        </div>

                        <div style={{
                            background: '#f5f5f5', borderRadius: '10px', padding: '12px',
                            margin: '0 0 24px', wordBreak: 'break-all'
                        }}>
                            <small className="text-muted d-block mb-1">Can't scan? Enter this key manually:</small>
                            <code style={{ fontSize: '13px', color: '#333', letterSpacing: '1px' }}>{secret}</code>
                        </div>

                        <Form onSubmit={handleConfirm}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Enter 6-digit code from your app</Form.Label>
                                <Form.Control
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    style={{
                                        textAlign: 'center', letterSpacing: '12px',
                                        fontSize: '28px', fontWeight: '700',
                                        borderRadius: '12px', padding: '14px',
                                        border: '2px solid #e0e0e0'
                                    }}
                                    autoFocus
                                />
                            </Form.Group>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="w-100"
                                size="lg"
                                style={{
                                    borderRadius: '12px', padding: '14px',
                                    fontWeight: '600',
                                    background: 'linear-gradient(135deg, #00796B, #004D40)',
                                    border: 'none'
                                }}
                            >
                                {loading ? <Spinner size="sm" animation="border" className="me-2" /> : null}
                                Verify & Enable MFA
                            </Button>
                        </Form>
                    </div>
                )}

                {/* Step 3: Backup Codes */}
                {step === 'backup' && (
                    <div className="text-center">
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00C853, #00E676)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 8px 30px rgba(0,200,83,0.3)'
                        }}>
                            <CheckCircleFill size={40} color="white" />
                        </div>
                        <h3 style={{ fontWeight: '700', color: '#2e7d32' }}>MFA Enabled! 🎉</h3>
                        <p className="text-muted mt-2">
                            Two-Factor Authentication is now active on your account.
                        </p>

                        <div style={{
                            background: '#fff8e1', border: '1px solid #ffe082',
                            borderRadius: '16px', padding: '20px', margin: '24px 0',
                            textAlign: 'left'
                        }}>
                            <h6 className="fw-bold mb-2" style={{ color: '#e65100' }}>
                                ⚠️ Save Your Backup Codes
                            </h6>
                            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px' }}>
                                Store these codes in a safe place. Each code can only be used once if you lose access to your authenticator app.
                            </p>
                            <div style={{
                                background: '#ffffff', borderRadius: '10px', padding: '16px',
                                display: 'grid', gridTemplateColumns: '1fr 1fr',
                                gap: '8px', border: '1px solid #eee'
                            }}>
                                {backupCodes.map((bc, i) => (
                                    <code key={i} style={{
                                        display: 'block', textAlign: 'center',
                                        padding: '8px', background: '#f9f9f9',
                                        borderRadius: '6px', fontSize: '14px',
                                        fontWeight: '600', letterSpacing: '2px'
                                    }}>{bc}</code>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={copyBackupCodes}
                            variant="outline-secondary"
                            className="w-100 mb-3"
                            style={{ borderRadius: '10px', padding: '10px', fontWeight: '600' }}
                        >
                            <ClipboardCheck className="me-2" />
                            {copiedCodes ? 'Copied! ✅' : 'Copy All Codes'}
                        </Button>

                        <Alert variant="info" style={{ borderRadius: '10px', fontSize: '13px' }}>
                            📧 We've also emailed these backup codes to your registered email address.
                        </Alert>

                        <Button
                            href="/dashboard"
                            size="lg"
                            className="w-100 mt-2"
                            style={{
                                borderRadius: '12px', padding: '14px', fontWeight: '600',
                                background: 'linear-gradient(135deg, #00796B, #004D40)',
                                border: 'none'
                            }}
                        >
                            Done — Go to Dashboard
                        </Button>
                    </div>
                )}
            </div>
        </Container>
    );
}

export default MfaSetup;
