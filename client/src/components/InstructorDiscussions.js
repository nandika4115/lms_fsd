import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Form, Tabs, Tab } from 'react-bootstrap';
import { ChatDots, Send, Person, Reply, BookFill, Clock } from 'react-bootstrap-icons';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

function InstructorDiscussions() {
    const [discussions, setDiscussions] = useState([]);
    const [replies, setReplies] = useState({});
    const [newReply, setNewReply] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const { isAuthLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    // Fetch all discussions from instructor's courses
    useEffect(() => {
        if (isAuthLoading) return;
        
        const fetchInstructorDiscussions = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/discussions/instructor/my-discussions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDiscussions(response.data.discussions || []);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load discussions");
            } finally {
                setLoading(false);
            }
        };

        fetchInstructorDiscussions();
    }, [isAuthLoading, navigate]);

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

    // Group discussions by course
    const discussionsByCourse = discussions.reduce((acc, discussion) => {
        const courseTitle = discussion.course_title;
        if (!acc[courseTitle]) {
            acc[courseTitle] = [];
        }
        acc[courseTitle].push(discussion);
        return acc;
    }, {});

    // Filter discussions based on active tab
    const getFilteredDiscussions = () => {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        switch (activeTab) {
            case 'recent':
                return discussions.filter(d => new Date(d.created_at) > oneDayAgo);
            case 'week':
                return discussions.filter(d => new Date(d.created_at) > oneWeekAgo);
            case 'unanswered':
                return discussions.filter(d => (d.reply_count || 0) === 0);
            default:
                return discussions;
        }
    };

    if (isAuthLoading || loading) {
        return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    }

    if (error) {
        return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    }

    const filteredDiscussions = getFilteredDiscussions();

    return (
        <Container className="my-4">
            <Row>
                <Col>
                    {/* Header */}
                    <Card className="mb-4">
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="mb-0">
                                        <ChatDots className="me-2" />
                                        Course Questions & Discussions
                                    </h4>
                                    <small className="text-muted">
                                        Manage questions from all your courses
                                    </small>
                                </div>
                                <Badge bg="primary" pill>
                                    {discussions.length} Total Questions
                                </Badge>
                            </div>
                        </Card.Header>
                    </Card>

                    {/* Filter Tabs */}
                    <Card className="mb-4">
                        <Card.Body>
                            <Tabs
                                activeKey={activeTab}
                                onSelect={(k) => setActiveTab(k)}
                                className="mb-0"
                            >
                                <Tab eventKey="all" title={`All (${discussions.length})`}>
                                </Tab>
                                <Tab eventKey="recent" title={`Recent (${discussions.filter(d => new Date(d.created_at) > new Date(Date.now() - 24*60*60*1000)).length})`}>
                                </Tab>
                                <Tab eventKey="week" title={`This Week (${discussions.filter(d => new Date(d.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length})`}>
                                </Tab>
                                <Tab eventKey="unanswered" title={`Unanswered (${discussions.filter(d => (d.reply_count || 0) === 0).length})`}>
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>

                    {/* Statistics Cards */}
                    <Row className="mb-4">
                        <Col md={3}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-primary">{discussions.length}</h5>
                                    <small>Total Questions</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-success">{discussions.filter(d => (d.reply_count || 0) > 0).length}</h5>
                                    <small>Answered</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-warning">{discussions.filter(d => (d.reply_count || 0) === 0).length}</h5>
                                    <small>Unanswered</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-info">{Object.keys(discussionsByCourse).length}</h5>
                                    <small>Courses</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Discussions List */}
                    {filteredDiscussions.length === 0 ? (
                        <Card>
                            <Card.Body className="text-center py-5">
                                <ChatDots size={48} className="text-muted mb-3" />
                                <h5>No questions found</h5>
                                <p className="text-muted">
                                    {activeTab === 'all' 
                                        ? "Students haven't asked any questions yet."
                                        : `No questions found for "${activeTab}" filter.`
                                    }
                                </p>
                            </Card.Body>
                        </Card>
                    ) : (
                        filteredDiscussions.map(discussion => (
                            <Card key={discussion.id} className="mb-3">
                                <Card.Body>
                                    {/* Course Badge */}
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <Badge bg="secondary" className="mb-2">
                                            <BookFill className="me-1" />
                                            {discussion.course_title}
                                        </Badge>
                                        <small className="text-muted">
                                            <Clock className="me-1" />
                                            {new Date(discussion.created_at).toLocaleDateString()}
                                        </small>
                                    </div>

                                    {/* Question */}
                                    <div className="d-flex align-items-start mb-3">
                                        <Person className="me-2 mt-1 text-primary" />
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">{discussion.title}</h6>
                                            <p className="mb-2">{discussion.content}</p>
                                            <small className="text-muted">
                                                by {discussion.student_name || 'Anonymous'} • {discussion.student_email}
                                            </small>
                                        </div>
                                        <Badge 
                                            bg={(discussion.reply_count || 0) === 0 ? 'warning' : 'success'}
                                            pill
                                        >
                                            {discussion.reply_count || 0} replies
                                        </Badge>
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
                                            View All Replies ({replies[discussion.id]?.length || 0})
                                        </Button>

                                        {/* Show Replies */}
                                        {replies[discussion.id] && (
                                            <div className="ms-3 mb-3">
                                                {replies[discussion.id].map(reply => (
                                                    <div key={reply.id} className="border-start ps-3 mb-2 bg-light p-2 rounded">
                                                        <p className="mb-1">{reply.content}</p>
                                                        <small className="text-muted">
                                                            <strong>{reply.author_name || 'Anonymous'}</strong> • {new Date(reply.created_at).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Instructor Reply Form */}
                                        <Form onSubmit={(e) => { e.preventDefault(); handleAddReply(discussion.id); }}>
                                            <div className="d-flex">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Write your response as instructor..."
                                                    value={newReply[discussion.id] || ''}
                                                    onChange={(e) => setNewReply(prev => ({ ...prev, [discussion.id]: e.target.value }))}
                                                />
                                                <Button type="submit" variant="primary" className="ms-2">
                                                    <Send className="me-1" />
                                                    Reply
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
        </Container>
    );
}

export default InstructorDiscussions;
