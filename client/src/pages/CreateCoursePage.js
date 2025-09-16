import React from 'react';
import { Container, Form, Button, Card, Image, Alert, Row, Col } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = "http://localhost:5000";

function CreateCoursePage() {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [serverError, setServerError] = React.useState('');
    const navigate = useNavigate();
    
    // Watch the thumbnail URL field to show a live preview
    const thumbnailUrl = watch('thumbnail_url');

    const onSubmit = async (data) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_URL}/api/courses`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/dashboard'); // Redirect to dashboard on success
        } catch (err) {
            setServerError(err.response?.data?.message || 'Failed to create course.');
        }
    };

    return (
        <Container className="my-5">
             <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="p-4 shadow-sm">
                        <h2 className="mb-4">Create a New Course</h2>
                        {serverError && <Alert variant="danger">{serverError}</Alert>}
                        <Form onSubmit={handleSubmit(onSubmit)}>
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

                            <Button variant="primary" type="submit">Create Course as Draft</Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default CreateCoursePage;