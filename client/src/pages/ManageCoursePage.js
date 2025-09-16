import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Form, Modal, ListGroup } from 'react-bootstrap';
import { PencilSquare, Trash, PlayBtn, PlusCircle, ArrowUp, ArrowDown } from 'react-bootstrap-icons';
import { useForm } from 'react-hook-form';
import axios from 'axios';
// REMOVED: No longer need react-beautiful-dnd

const API_URL = "http://localhost:5000";

// (Helper functions like getYouTubeEmbedUrl and VideoPreviewModal remain the same)
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


function ManageCoursePage() {
    const { id } = useParams();
    const [course, setCourse] = React.useState(null);
    const [lessons, setLessons] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [editingLesson, setEditingLesson] = React.useState(null);
    const [isFormVisible, setIsFormVisible] = React.useState(false);
    const [showPreview, setShowPreview] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState('');
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
    
    // This state is no longer needed as we save on each click
    // const [isOrderChanged, setIsOrderChanged] = React.useState(false);

    React.useEffect(() => {
        const fetchCourseAndLessons = async () => {
            const token = localStorage.getItem('token');
            try {
                const [courseRes, lessonsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                    // --- THIS LINE HAS BEEN FIXED ---
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
                setLessons(lessons.map(l => l.id === editingLesson.id ? { ...l, title: lessonData.title, content: lessonData.content_url } : l));
            } else {
                // When a new lesson is added, re-fetch to get the correct order
                await axios.post(`${API_URL}/api/lessons/course/${id}`, lessonData, { headers: { Authorization: `Bearer ${token}` } });
                const lessonsRes = await axios.get(`${API_URL}/api/lessons/course/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                setLessons(lessonsRes.data);
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

    // --- NEW: Function to handle moving a lesson up or down ---
    const handleMoveLesson = async (lessonId, direction) => {
        const token = localStorage.getItem('token');
        const lessonIndex = lessons.findIndex(l => l.id === lessonId);

        if ((direction === 'up' && lessonIndex === 0) || (direction === 'down' && lessonIndex === lessons.length - 1)) {
            return; // Can't move first item up or last item down
        }

        // Optimistically update the UI for a fast user experience
        const newLessons = [...lessons];
        const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
        [newLessons[lessonIndex], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[lessonIndex]]; // Swap elements
        setLessons(newLessons);

        try {
            // Send the full new order to the backend to be saved
            const orderedLessonIds = newLessons.map(l => l.id);
            await axios.put(`${API_URL}/api/lessons/course/${id}/order`, { orderedLessonIds }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            // If the save fails, revert the UI and show an error
            setLessons(lessons); // Revert to the original order
            alert("Failed to save new order. Please try again.");
        }
    };


    const handleEditClick = (lesson) => {
        setEditingLesson(lesson);
        setValue("title", lesson.title);
        setValue("content_url", lesson.content);
        setIsFormVisible(true);
    };

    const handleAddClick = () => {
        setEditingLesson(null);
        reset({ title: '', content_url: '' });
        setIsFormVisible(true);
    };

    const resetForm = () => {
        setEditingLesson(null);
        reset({ title: '', content_url: '' });
        setIsFormVisible(false);
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
            <p className="text-muted mb-5">Add, edit, and reorder your lessons below.</p>

            <Row>
                <Col md={isFormVisible ? 7 : 12}>
                    <Card>
                        <Card.Header as="h4" className="d-flex justify-content-between align-items-center">
                            <span>Course Lessons ({lessons.length})</span>
                            <Button variant="primary" onClick={handleAddClick}>
                                <PlusCircle className="me-2" /> Add Lesson
                            </Button>
                        </Card.Header>
                        <ListGroup variant="flush">
                            {lessons.length > 0 ? lessons.map((lesson, index) => (
                                <ListGroup.Item key={lesson.id} className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        {/* --- NEW: Up and Down Buttons --- */}
                                        <div className="d-flex flex-column me-3">
                                            <Button variant="link" size="sm" className="p-0 text-muted" onClick={() => handleMoveLesson(lesson.id, 'up')} disabled={index === 0}>
                                                <ArrowUp />
                                            </Button>
                                            <Button variant="link" size="sm" className="p-0 text-muted" onClick={() => handleMoveLesson(lesson.id, 'down')} disabled={index === lessons.length - 1}>
                                                <ArrowDown />
                                            </Button>
                                        </div>
                                        <span>{lesson.title}</span>
                                    </div>
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

