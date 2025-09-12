import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Form, Modal, ListGroup } from 'react-bootstrap';
import { PencilSquare, Trash, PlayBtn, PlusCircle } from 'react-bootstrap-icons';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const API_URL = "http://localhost:5000";

// --- A robust helper function to get the correct YouTube embed URL ---
const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    try {
        if (url.includes('watch?v=')) {
            const urlParams = new URLSearchParams(new URL(url).search);
            videoId = urlParams.get('v');
        } else if (url.includes('youtu.be')) {
            videoId = url.substring(url.lastIndexOf('/') + 1);
        } else if (url.includes('/embed/')) {
            videoId = url.substring(url.lastIndexOf('/') + 1);
        }
    } catch (e) {
        console.error("Invalid URL for YouTube parsing", e);
        return '';
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
};

// --- Video Preview Modal Component ---
const VideoPreviewModal = ({ show, handleClose, videoUrl }) => {
    const embedUrl = getYouTubeEmbedUrl(videoUrl);
    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Video Preview</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {embedUrl ? (
                    <div className="ratio ratio-16x9">
                        <iframe src={embedUrl} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </div>
                ) : (
                    <Alert variant="warning">Could not load video. Please ensure it's a valid YouTube URL.</Alert>
                )}
            </Modal.Body>
        </Modal>
    );
};

// --- Main Manage Course Page Component ---
function ManageCoursePage() {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingLesson, setEditingLesson] = useState(null);
    
    // --- NEW STATE TO CONTROL FORM VISIBILITY ---
    const [isFormVisible, setIsFormVisible] = useState(false);

    const [showPreview, setShowPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
    
    useEffect(() => {
        const fetchCourseAndLessons = async () => {
            const token = localStorage.getItem('token');
            try {
                const [courseRes, lessonsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/lessons/course/${id}`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setCourse(courseRes.data);
                setLessons(lessonsRes.data);
            } catch (err) {
                setError("Could not load course data. You may not be the owner.");
            } finally {
                setLoading(false);
            }
        };
        fetchCourseAndLessons();
    }, [id]);

    const onSubmit = async (data) => {
        const token = localStorage.getItem('token');
        const lessonData = { title: data.title, content_url: data.content_url };
        try {
            if (editingLesson) {
                await axios.put(`${API_URL}/api/lessons/${editingLesson.id}`, lessonData, { headers: { Authorization: `Bearer ${token}` } });
                // --- FIX: Ensure the 'content' property is correctly updated in the state ---
                setLessons(lessons.map(l => l.id === editingLesson.id ? { ...l, title: lessonData.title, content: lessonData.content_url } : l));
            } else {
                const response = await axios.post(`${API_URL}/api/lessons/course/${id}`, lessonData, { headers: { Authorization: `Bearer ${token}` } });
                // --- FIX: Ensure the new lesson object has a 'content' property ---
                setLessons([...lessons, { id: response.data.lessonId, title: lessonData.title, content: lessonData.content_url, course_id: id }]);
            }
            resetForm();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save lesson.");
        }
    };
    
    const handleDelete = async (lessonId) => {
        if (window.confirm("Are you sure you want to delete this lesson?")) {
            const token = localStorage.getItem('token');
            try {
                await axios.delete(`${API_URL}/api/lessons/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } });
                setLessons(lessons.filter(l => l.id !== lessonId));
            } catch (err) {
                 alert(err.response?.data?.message || "Failed to delete lesson.");
            }
        }
    };

    const handleEditClick = (lesson) => {
        setEditingLesson(lesson);
        setValue("title", lesson.title);
        setValue("content_url", lesson.content);
        setIsFormVisible(true); // --- Show the form when editing ---
    };

    const handleAddClick = () => {
        setEditingLesson(null);
        reset({ title: '', content_url: '' });
        setIsFormVisible(true); // --- Show the form to add a new lesson ---
    };

    const resetForm = () => {
        setEditingLesson(null);
        reset({ title: '', content_url: '' });
        setIsFormVisible(false); // --- Hide the form on cancel or after submit ---
    };

    const handlePreviewClick = (url) => {
        setPreviewUrl(url);
        setShowPreview(true);
    };

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="my-5">
            <h1 className="mb-2">Manage Course: {course?.title}</h1>
            <p className="text-muted mb-5">Add, edit, and manage your lessons below.</p>

            <Row>
                <Col md={isFormVisible ? 7 : 12}> {/* Make list full width if form is hidden */}
                    <Card>
                        <Card.Header as="h4" className="d-flex justify-content-between align-items-center">
                            <span>Course Lessons ({lessons.length})</span>
                            {/* --- THIS IS THE RESTORED "ADD LESSON" BUTTON --- */}
                            <Button variant="primary" onClick={handleAddClick}>
                                <PlusCircle className="me-2" /> Add Lesson
                            </Button>
                        </Card.Header>
                        <ListGroup variant="flush">
                            {lessons.length > 0 ? lessons.map(lesson => (
                                <ListGroup.Item key={lesson.id} className="d-flex justify-content-between align-items-center">
                                    <span>{lesson.title}</span>
                                    <div>
                                        <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handlePreviewClick(lesson.content)}>
                                            <PlayBtn /> Preview
                                        </Button>
                                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditClick(lesson)}>
                                            <PencilSquare /> Edit
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(lesson.id)}>
                                            <Trash /> Delete
                                        </Button>
                                    </div>
                                </ListGroup.Item>
                            )) : (
                                <ListGroup.Item>No lessons have been added to this course yet.</ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card>
                </Col>

                {/* --- The form is now conditionally rendered --- */}
                {isFormVisible && (
                    <Col md={5}>
                        <Card>
                            <Card.Header as="h4">{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</Card.Header>
                            <Card.Body>
                                <Form onSubmit={handleSubmit(onSubmit)}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Lesson Title</Form.Label>
                                        <Form.Control type="text" {...register("title", { required: "Title is required." })} />
                                        {errors.title && <p className="text-danger mt-1 small">{errors.title.message}</p>}
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Content URL (YouTube)</Form.Label>
                                        <Form.Control type="text" placeholder="https://www.youtube.com/watch?v=..." {...register("content_url", { required: "Content URL is required." })} />
                                        {errors.content_url && <p className="text-danger mt-1 small">{errors.content_url.message}</p>}
                                    </Form.Group>
                                    <div className="d-flex gap-2">
                                        <Button variant="primary" type="submit">{editingLesson ? 'Save Changes' : 'Save Lesson'}</Button>
                                        <Button variant="secondary" onClick={resetForm}>Cancel</Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                )}
            </Row>

            <VideoPreviewModal show={showPreview} handleClose={() => setShowPreview(false)} videoUrl={previewUrl} />
        </Container>
    );
}

export default ManageCoursePage;

