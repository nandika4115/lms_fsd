import React, { useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = "http://localhost:5000";

function EditProfilePage() {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [serverError, setServerError] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const navigate = useNavigate();

    // 1. Fetch the user's current profile data when the page loads
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await axios.get(`${API_URL}/api/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // 2. The 'reset' function from react-hook-form populates the form fields
                reset(response.data);
            } catch (err) {
                setServerError("Could not load your profile data.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [reset]);

    // 3. This function runs when the user clicks "Save Changes"
    const onSubmit = async (data) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${API_URL}/api/profile`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/profile'); // Redirect back to the profile page on success
        } catch (err) {
            setServerError(err.response?.data?.message || 'Failed to update profile.');
        }
    };

    if (loading) {
        return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    }

    return (
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="p-4 shadow-sm">
                        <h2 className="mb-4">Edit Your Profile</h2>
                        {serverError && <Alert variant="danger">{serverError}</Alert>}
                        <Form onSubmit={handleSubmit(onSubmit)}>
                            {/* The form fields are pre-filled with the fetched data */}
                            <Row className="mb-3">
                                <Col sm={6}><Form.Group><Form.Label>First Name</Form.Label><Form.Control type="text" {...register("first_name", { required: "First name is required." })} /></Form.Group></Col>
                                <Col sm={6}><Form.Group><Form.Label>Last Name</Form.Label><Form.Control type="text" {...register("last_name", { required: "Last name is required." })} /></Form.Group></Col>
                            </Row>
                            <Form.Group className="mb-3"><Form.Label>Username</Form.Label><Form.Control type="text" {...register("username", { required: "Username is required." })} /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" {...register("email", { required: "Email is required." })} /></Form.Group>
                            <hr />
                            <Row className="mb-3">
                                <Col sm={6}><Form.Group><Form.Label>Phone Number</Form.Label><Form.Control type="tel" {...register("phone_number")} /></Form.Group></Col>
                                <Col sm={6}><Form.Group><Form.Label>Age</Form.Label><Form.Control type="number" {...register("age")} /></Form.Group></Col>
                            </Row>
                             <Row className="mb-3">
                                <Col sm={6}><Form.Group><Form.Label>Current Activity</Form.Label><Form.Select {...register("current_activity")}><option value="Studying">Studying</option><option value="Working">Working</option><option value="Other">Other</option></Form.Select></Form.Group></Col>
                                <Col sm={6}><Form.Group><Form.Label>Institution / Company</Form.Label><Form.Control type="text" {...register("activity_place")} /></Form.Group></Col>
                            </Row>

                            <Button variant="primary" type="submit" className="me-2">Save Changes</Button>
                            <Button variant="secondary" onClick={() => navigate('/profile')}>Cancel</Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default EditProfilePage;

