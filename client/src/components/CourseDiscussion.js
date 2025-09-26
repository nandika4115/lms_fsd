import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Form } from 'react-bootstrap';
import { ArrowLeft, ChatDots, Send, Person, Reply } from 'react-bootstrap-icons';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

function CourseDiscussion() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [discussions, setDiscussions] = useState([]);
    const [replies, setReplies] = useState({});
    const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
    const [newReply, setNewReply] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { isAuthLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    // Fetch course data and discussions
    useEffect(() => {
        if (isAuthLoading) return;
        
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                setLoading(true);
                // Fetch course info
                const courseResponse = await axios.get(`${API_URL}/api/courses/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourse(courseResponse.data);

                // Fetch discussions
                const discussionResponse = await axios.get(`${API_URL}/api/discussions/course/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDiscussions(discussionResponse.data.discussions || []);

            } catch (err) {
                setError(err.response?.data?.message || "Failed to load discussions");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId, isAuthLoading, navigate]);

    // Create new discussion
    const handleCreateDiscussion = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
            alert('Please fill in both title and content');
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(`${API_URL}/api/discussions/create`, {
                course_id: courseId,
                title: newQuestion.title,
                content: newQuestion.content
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Reset form and refresh discussions
            setNewQuestion({ title: '', content: '' });
            
            // Refresh discussions
            const response = await axios.get(`${API_URL}/api/discussions/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDiscussions(response.data.discussions || []);

        } catch (err) {
            alert('Failed to create discussion');
        } finally {
            setSubmitting(false);
        }
    };

    // Fetch replies for a discussion
    const fetchReplies = async (discussionId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_URL}/api/discussions/${discussionId}/replies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReplies(prev => ({
                ...prev,
                [discussionId]: response.data.replies || []
            }));
        } catch (err) {
            console.error('Error fetching replies:', err);
        }
    };

    // Add reply to discussion
    const handleAddReply = async (discussionId) => {
        const token = localStorage.getItem('token');
        const replyContent = newReply[discussionId];
        
        if (!replyContent?.trim()) return;

        try {
            await axios.post(`${API_URL}/api/discussions/reply`, {
                discussion_id: discussionId,
                content: replyContent
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Reset reply input and refresh replies
            setNewReply(prev => ({ ...prev, [discussionId]: '' }));
            fetchReplies(discussionId);

        } catch (err) {
            alert('Failed to add reply');
        }
    };

    if (isAuthLoading || loading) {
        return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    }

    if (error) {
        return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    }

    return (
        <Container className="my-4">
            <Row>
                <Col>
                    {/* Header */}
                    <Card className="mb-4">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <div>
                                <h4 className="mb-0">
                                    <ChatDots className="me-2" />
                                    Course Discussions
                                </h4>
                                <small className="text-muted">{course?.title}</small>
                            </div>
                            <div className="d-flex gap-2">
                                <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    onClick={() => {
                                        // Get the last lesson ID from localStorage or find the current lesson
                                        const lastLessonId = localStorage.getItem(`lastLesson_${courseId}`);
                                        if (lastLessonId && course?.lessons?.length > 0) {
                                            navigate(`/courses/${courseId}/lessons/${lastLessonId}`);
                                        } else if (course?.lessons?.length > 0) {
                                            // If no last lesson, go to first lesson
                                            navigate(`/courses/${courseId}/lessons/${course.lessons[0].id}`);
                                        } else {
                                            navigate(`/courses/${courseId}`);
                                        }
                                    }}
                                >
                                    <ArrowLeft className="me-2" />
                                    Back to Lesson
                                </Button>
                                <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => navigate(`/courses/${courseId}`)}
                                >
                                    <ArrowLeft className="me-2" />
                                    Back to Course
                                </Button>
                            </div>
                        </Card.Header>
                    </Card>

                    <Row>
                        {/* Create Question Form */}
                        <Col md={4}>
                            <Card className="sticky-top">
                                <Card.Header>
                                    <h5 className="mb-0">Ask a Question</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleCreateDiscussion}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Question Title</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="What's your question about?"
                                                value={newQuestion.title}
                                                onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Question Details</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={4}
                                                placeholder="Provide more details about your question..."
                                                value={newQuestion.content}
                                                onChange={(e) => setNewQuestion(prev => ({ ...prev, content: e.target.value }))}
                                                required
                                            />
                                        </Form.Group>
                                        <Button 
                                            type="submit" 
                                            variant="primary" 
                                            disabled={submitting}
                                            className="w-100"
                                        >
                                            {submitting ? <Spinner size="sm" /> : <><Send className="me-2" />Post Question</>}
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Discussions List */}
                        <Col md={8}>
                            {discussions.length === 0 ? (
                                <Card>
                                    <Card.Body className="text-center py-5">
                                        <ChatDots size={48} className="text-muted mb-3" />
                                        <h5>No discussions yet</h5>
                                        <p className="text-muted">Be the first to ask a question!</p>
                                    </Card.Body>
                                </Card>
                            ) : (
                                discussions.map(discussion => (
                                    <Card key={discussion.id} className="mb-3">
                                        <Card.Body>
                                            {/* Question */}
                                            <div className="d-flex align-items-start mb-3">
                                                <Person className="me-2 mt-1 text-primary" />
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-1">{discussion.title}</h6>
                                                    <p className="mb-2">{discussion.content}</p>
                                                    <small className="text-muted">
                                                        by {discussion.author_name || 'Anonymous'} • {new Date(discussion.created_at).toLocaleDateString()}
                                                    </small>
                                                </div>
                                            </div>

                                            {/* Replies Section */}
                                            <div className="border-top pt-3">
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="p-0 mb-2"
                                                    onClick={() => fetchReplies(discussion.id)}
                                                >
                                                    <Reply className="me-1" />
                                                    View Replies ({replies[discussion.id]?.length || 0})
                                                </Button>

                                                {/* Show Replies */}
                                                {replies[discussion.id] && (
                                                    <div className="ms-3 mb-3">
                                                        {replies[discussion.id].map(reply => (
                                                            <div key={reply.id} className="border-start ps-3 mb-2">
                                                                <p className="mb-1">{reply.content}</p>
                                                                <small className="text-muted">
                                                                    {reply.author_name || 'Anonymous'} • {new Date(reply.created_at).toLocaleDateString()}
                                                                </small>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Reply Form */}
                                                <Form onSubmit={(e) => { e.preventDefault(); handleAddReply(discussion.id); }}>
                                                    <div className="d-flex">
                                                        <Form.Control
                                                            size="sm"
                                                            type="text"
                                                            placeholder="Write a reply..."
                                                            value={newReply[discussion.id] || ''}
                                                            onChange={(e) => setNewReply(prev => ({ ...prev, [discussion.id]: e.target.value }))}
                                                        />
                                                        <Button type="submit" size="sm" variant="outline-primary" className="ms-2">
                                                            <Send />
                                                        </Button>
                                                    </div>
                                                </Form>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))
                            )}
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>
    );
}

export default CourseDiscussion;
