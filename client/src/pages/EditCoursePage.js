import React, { useEffect } from 'react';
import { Container, Form, Button, Card, Image, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = "http://localhost:5000";

function EditCoursePage() {
    // Get the course ID from the URL
    const { id } = useParams();
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
    const [serverError, setServerError] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const navigate = useNavigate();
    
    // Watch the thumbnail URL field to show a live preview
    const thumbnailUrl = watch('thumbnail_url');

    // Fetch existing course data when the component loads
    useEffect(() => {
        const fetchCourseData = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await axios.get(`${API_URL}/api/courses/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Use the 'reset' function from react-hook-form to populate the form
                reset(response.data);
            } catch (err) {
                setServerError("Could not load course data.");
            } finally {
                setLoading(false);
            }
        };
        fetchCourseData();
    }, [id, reset]);

    // Handle the form submission to UPDATE the course
    const onSubmit = async (data) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${API_URL}/api/courses/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/dashboard'); // Redirect to dashboard on success
        } catch (err) {
            setServerError(err.response?.data?.message || 'Failed to update course.');
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
                        <h2 className="mb-4">Edit Course</h2>
                        {serverError && <Alert variant="danger">{serverError}</Alert>}
                        <Form onSubmit={handleSubmit(onSubmit)}>
                            {/* The form is identical to the Create Course page */}
                            <Form.Group className="mb-3">
                                <Form.Label>Course Title</Form.Label>
                                <Form.Control type="text" {...register("title", { required: "Title is required." })} />
                                {errors.title && <p className="text-danger mt-1 small">{errors.title.message}</p>}
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={4} {...register("description", { required: "Description is required." })} />
                                {errors.description && <p className="text-danger mt-1 small">{errors.description.message}</p>}
                            </Form.Group>
                            
                             <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Category</Form.Label>
                                        <Form.Control type="text" {...register("category", { required: "Category is required." })} />
                                        {errors.category && <p className="text-danger mt-1 small">{errors.category.message}</p>}
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Level</Form.Label>
                                        <Form.Select {...register("level", { required: "Level is required." })}>
                                            <option value="">Select Level...</option>
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </Form.Select>
                                        {errors.level && <p className="text-danger mt-1 small">{errors.level.message}</p>}
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Thumbnail Image URL</Form.Label>
                                <Form.Control type="text" placeholder="https://example.com/image.jpg" {...register("thumbnail_url")} />
                            </Form.Group>
                            
                            {thumbnailUrl && (
                                <div className="mb-3 text-center">
                                    <p className="mb-1 text-muted">Image Preview:</p>
                                    <Image src={thumbnailUrl} thumbnail style={{ maxWidth: '250px' }} />
                                </div>
                            )}

                            <Button variant="primary" type="submit">Save Changes</Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default EditCoursePage;