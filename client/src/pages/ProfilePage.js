import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

// Helper component to render each profile field consistently
// This creates a layout similar to your original, which your CSS can style.
const ProfileField = ({ label, value }) => (
    <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
        <span className="text-muted">{label}</span>
        {/* This logic safely handles empty data and shows 'Not provided' as a fallback */}
        <span className="fw-bold">{value || 'Not provided'}</span>
    </div>
);

function ProfilePage() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useContext(AuthContext);

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
            } catch (err) {
                setError("Could not load profile data.");
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
            <Card className="p-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="mb-0">My Profile</h1>
                    <Button as={Link} to="/profile/edit" variant="outline-primary">Edit Profile</Button>
                </div>

                <h4 className="mb-4 fw-light">Welcome, {user?.username || 'User'}!</h4>
                
                {/* Using the helper component makes the code cleaner and less error-prone */}
                <ProfileField label="Full Name" value={fullName} />
                <ProfileField label="Username" value={profileData.username} />
                <ProfileField label="Email" value={profileData.email} />
                <ProfileField label="Account Role" value={profileData.role} />
                <ProfileField label="Phone Number" value={profileData.phone_number} />
                <ProfileField label="Age" value={profileData.age} />
                <ProfileField label="Current Activity" value={profileData.current_activity} />
                <ProfileField label="Institution/Company" value={profileData.activity_place} />
                <ProfileField label="Member Since" value={new Date(profileData.created_at).toLocaleDateString()} />
            </Card>
        </Container>
    );
}

export default ProfilePage;

