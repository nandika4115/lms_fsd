import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { ShieldLock, Key } from 'react-bootstrap-icons';

/**
 * MfaVerify — Inline MFA code input shown inside the Login page
 * when the server responds with mfaRequired: true.
 *
 * Props:
 *   - tempToken: the short-lived JWT from the login response
 *   - onSuccess(token, role): callback with the full JWT after MFA
 *   - onCancel(): callback to go back to the login form
 */
function MfaVerify({ tempToken, onSuccess, onCancel }) {
    const [code, setCode] = useState('');
    const [isBackupCode, setIsBackupCode] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = "http://localhost:5000";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('Please enter a code.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/auth/verify-mfa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tempToken, code: code.trim(), isBackupCode })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Verification failed');
            }

            onSuccess(data.token, data.role);
        } catch (err) {
            setError(err.message);
        }

        setLoading(false);
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="text-center mb-4">
                <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1a237e, #283593)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 6px 20px rgba(26,35,126,0.25)'
                }}>
                    <ShieldLock size={28} color="white" />
                </div>
                <h4 className="fw-bold mb-1">Two-Factor Authentication</h4>
                <p className="text-muted" style={{ fontSize: '14px' }}>
                    {isBackupCode
                        ? 'Enter one of your backup codes'
                        : 'Enter the 6-digit code from your authenticator app'
                    }
                </p>
            </div>

            <Form onSubmit={handleSubmit}>
                {error && <Alert variant="danger" style={{ borderRadius: '10px' }}>{error}</Alert>}

                <Form.Group className="mb-3">
                    <Form.Control
                        type="text"
                        maxLength={isBackupCode ? 8 : 6}
                        placeholder={isBackupCode ? 'XXXXXXXX' : '000000'}
                        value={code}
                        onChange={(e) => {
                            const val = isBackupCode
                                ? e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
                                : e.target.value.replace(/\D/g, '');
                            setCode(val);
                        }}
                        style={{
                            textAlign: 'center',
                            letterSpacing: isBackupCode ? '4px' : '12px',
                            fontSize: isBackupCode ? '20px' : '28px',
                            fontWeight: '700',
                            borderRadius: '12px',
                            padding: '14px',
                            border: '2px solid #e0e0e0'
                        }}
                        autoFocus
                    />
                </Form.Group>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-100 mb-3"
                    style={{
                        borderRadius: '10px', padding: '12px',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #1a237e, #283593)',
                        border: 'none',
                        boxShadow: '0 4px 15px rgba(26,35,126,0.3)'
                    }}
                >
                    {loading ? (
                        <><Spinner size="sm" animation="border" className="me-2" /> Verifying...</>
                    ) : (
                        'Verify Code'
                    )}
                </Button>
            </Form>

            <div className="text-center">
                <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                        setIsBackupCode(!isBackupCode);
                        setCode('');
                        setError('');
                    }}
                    className="text-decoration-none"
                >
                    <Key className="me-1" />
                    {isBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
                </Button>
                <br />
                <Button
                    variant="link"
                    size="sm"
                    onClick={onCancel}
                    className="text-muted text-decoration-none mt-1"
                >
                    ← Back to login
                </Button>
            </div>
        </div>
    );
}

export default MfaVerify;
