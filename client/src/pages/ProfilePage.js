import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, Button, Badge, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PersonCircle, ShieldLock, ShieldCheck, ShieldExclamation } from 'react-bootstrap-icons';
import axios from 'axios';

const API_URL = "http://localhost:5000";

// Minimal ProfileField component
const ProfileField = ({ label, value }) => (
    <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
        <span className="text-muted">{label}</span>
        <span className="fw-semibold">{value || <span className="text-muted fst-italic">Not provided</span>}</span>
    </div>
);

function ProfilePage() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mfaStatus, setMfaStatus] = useState(false);
    const [disablingMfa, setDisablingMfa] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [showDisableForm, setShowDisableForm] = useState(false);
    const [mfaMessage, setMfaMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("You must be logged in to view your profile.");
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get(`${API_URL}/api/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfileData(response.data);
                setMfaStatus(response.data.mfa_enabled || false);
            } catch (err) {
                setError(err.response?.data?.message || "Could not load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    }

    if (error) {
        return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    }

    if (!profileData) {
        return <Container className="my-5"><Alert variant="warning">No profile data found.</Alert></Container>;
    }

    // This correctly combines the first and last name into a single string
    const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();

    return (
        <Container className="my-5">
            <div className="d-flex justify-content-center">
                <Card className="shadow-sm border-0 rounded-3" style={{ maxWidth: '700px', width: '100%' }}>
                    <Card.Body className="p-4">
                        {/* Top Section with Profile Picture and Basic Info */}
                        <Row className="align-items-center mb-4">
                            <Col xs="auto">
                                <PersonCircle size={80} className="text-primary" />
                            </Col>
                            <Col>
                                <h3 className="mb-1">{fullName || profileData.username || 'User'}</h3>
                                <p className="text-muted mb-0">@{profileData.username}</p>
                                <p className="text-muted small mb-0">{profileData.email}</p>
                            </Col>
                        </Row>

                        {/* Role and Edit Button Row */}
                        <Row className="mb-4">
                            <Col xs="auto">
                                <Badge 
                                    bg={profileData.role === 'instructor' ? 'warning' : 'primary'} 
                                    className="px-3 py-2"
                                >
                                    {profileData.role?.charAt(0).toUpperCase() + profileData.role?.slice(1) || 'Student'}
                                </Badge>
                            </Col>
                            <Col xs="auto">
                                <Button as={Link} to="/profile/edit" variant="outline-primary" size="sm">
                                    Edit Profile
                                </Button>
                            </Col>
                        </Row>

                        {/* Profile Details */}
                        <div>
                            <h6 className="text-muted mb-3">Profile Details</h6>
                            <Row>
                                <Col md={6}>
                                    <ProfileField label="Phone Number" value={profileData.phone_number} />
                                    <ProfileField label="Age" value={profileData.age} />
                                    <ProfileField label="Current Activity" value={profileData.current_activity} />
                                </Col>
                                <Col md={6}>
                                    <ProfileField label="Institution/Company" value={profileData.activity_place} />
                                    <ProfileField label="Member Since" value={new Date(profileData.created_at).toLocaleDateString()} />
                                </Col>
                            </Row>
                        </div>

                        {/* Security Section */}
                        <div className="mt-4 pt-3">
                            <h6 className="text-muted mb-3"><ShieldLock className="me-2" />Security</h6>
                            <Card className="border" style={{ borderRadius: '12px' }}>
                                <Card.Body className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="d-flex align-items-center mb-1">
                                            {mfaStatus ? (
                                                <ShieldCheck size={20} className="text-success me-2" />
                                            ) : (
                                                <ShieldExclamation size={20} className="text-warning me-2" />
                                            )}
                                            <strong>Two-Factor Authentication</strong>
                                        </div>
                                        <small className="text-muted">
                                            {mfaStatus 
                                                ? 'MFA is enabled — your account has extra protection.' 
                                                : 'Add an extra layer of security with an authenticator app.'
                                            }
                                        </small>
                                    </div>
                                    <div>
                                        {mfaStatus ? (
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm"
                                                onClick={() => setShowDisableForm(!showDisableForm)}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                Disable
                                            </Button>
                                        ) : (
                                            <Button 
                                                as={Link} 
                                                to="/mfa-setup" 
                                                variant="primary" 
                                                size="sm"
                                                style={{ borderRadius: '8px', fontWeight: '600' }}
                                            >
                                                Enable MFA
                                            </Button>
                                        )}
                                    </div>
                                </Card.Body>
                                {showDisableForm && (
                                    <Card.Footer style={{ background: '#fff5f5', borderTop: '1px solid #ffcdd2' }}>
                                        <p className="small text-muted mb-2">Enter your password to disable MFA:</p>
                                        <div className="d-flex gap-2">
                                            <input
                                                type="password"
                                                className="form-control form-control-sm"
                                                placeholder="Your password"
                                                value={disablePassword}
                                                onChange={(e) => setDisablePassword(e.target.value)}
                                                style={{ borderRadius: '8px', maxWidth: '250px' }}
                                            />
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                disabled={disablingMfa || !disablePassword}
                                                onClick={async () => {
                                                    setDisablingMfa(true);
                                                    setMfaMessage('');
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        await axios.post(`${API_URL}/api/auth/disable-mfa`, 
                                                            { password: disablePassword },
                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                        );
                                                        setMfaStatus(false);
                                                        setShowDisableForm(false);
                                                        setDisablePassword('');
                                                        setMfaMessage('MFA disabled successfully.');
                                                    } catch (err) {
                                                        setMfaMessage(err.response?.data?.message || 'Failed to disable MFA.');
                                                    }
                                                    setDisablingMfa(false);
                                                }}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                {disablingMfa ? 'Disabling...' : 'Confirm Disable'}
                                            </Button>
                                        </div>
                                        {mfaMessage && <small className="text-danger mt-2 d-block">{mfaMessage}</small>}
                                    </Card.Footer>
                                )}
                            </Card>
                            {mfaMessage && !showDisableForm && (
                                <Alert variant="success" className="mt-2" style={{ borderRadius: '10px', fontSize: '14px' }}>
                                    {mfaMessage}
                                </Alert>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
}

export default ProfilePage;

