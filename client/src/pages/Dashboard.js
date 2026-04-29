import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, ProgressBar, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
// Import all necessary icons
import {  PeopleFill, PlayCircleFill, PatchCheckFill, StarFill, TrophyFill, MortarboardFill, Gem, ChatDots } from 'react-bootstrap-icons'; 

const API_URL = "http://localhost:5000";

// --- UPDATED: A map to make all achievements look nice on the frontend ---
const achievementMap = {
    'COURSE_COMPLETION_1': { icon: <TrophyFill />, title: 'First Course Completed', color: '#6f42c1' },
    'COURSE_COMPLETION_3': { icon: <StarFill />, title: 'Serial Learner (3 Courses)', color: '#fd7e14' },
    'COURSE_COMPLETION_5': { icon: <MortarboardFill />, title: 'Dedicated Scholar (5 Courses)', color: '#0d6efd' },
    'BADGE_COLLECTOR_3': { icon: <Gem />, title: 'Badge Collector (3 Achievements)', color: '#d63384' },
};
// --- The New, Upgraded Student Dashboard Component ---
const StudentDashboard = ({ data, userName }) => {
    const { enrolledCourses, learningStreak, achievements, recommendations, certificateCount } = data;

    return (
    <div>
        {/* --- Enhanced Welcome Header --- */}
        <h1 className="mb-5 fw-bold" style={{ 
            background: 'linear-gradient(135deg , #4ba261ff, #4c6e3cff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '2.5rem'
        }}>
            Welcome to your Dashboard, {userName}!
        </h1>

        {/* --- Enhanced Student Stats Section --- */}
        <h2 className="mb-4 fw-bold" style={{ color: '#2c3e50', fontSize: '1.8rem' }}>
            My Progress
        </h2>
        <Row className="mb-5 g-3">
            <Col md={4}>
                <Card 
                    body 
                    className="text-center h-100 border-0"
                    style={{
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.15)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0px)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.15)';
                    }}
                >
                    <div 
                        className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                        style={{
                            width: '70px',
                            height: '70px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            borderRadius: '50%',
                            fontSize: '2rem'
                        }}
                    >
                        🔥
                    </div>
                    <h3 className="fw-bold mb-1" style={{ color: '#667eea', fontSize: '2rem' }}>
                        {learningStreak} Day
                    </h3>
                    <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                        Learning Streak
                    </p>
                </Card>
            </Col>
            
            <Col md={4}>
                <Card 
                    body 
                    className="text-center h-100 border-0"
                    style={{
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 15px rgba(240, 147, 251, 0.15)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(240, 147, 251, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0px)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(240, 147, 251, 0.15)';
                    }}
                >
                    <div 
                        className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                        style={{
                            width: '70px',
                            height: '70px',
                            background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                            borderRadius: '50%',
                            fontSize: '2rem'
                        }}
                    >
                        📚
                    </div>
                    <h3 className="fw-bold mb-1" style={{ color: '#f093fb', fontSize: '2rem' }}>
                        {enrolledCourses.length}
                    </h3>
                    <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                        Courses Enrolled
                    </p>
                </Card>
            </Col>
            
            <Col md={4}>
                <Card 
                    body 
                    className="text-center h-100 border-0"
                    style={{
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 15px rgba(79, 172, 254, 0.15)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(79, 172, 254, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0px)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.15)';
                    }}
                >
                    <div 
                        className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                        style={{
                            width: '70px',
                            height: '70px',
                            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                            borderRadius: '50%',
                            fontSize: '2rem'
                        }}
                    >
                        🏆
                    </div>
                    <h3 className="fw-bold mb-1" style={{ color: '#4facfe', fontSize: '2rem' }}>
                        {certificateCount}
                    </h3>
                    <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                        Certificates Earned
                    </p>
                </Card>
            </Col>
        </Row>

        {/* --- Two Column Layout: Enhanced Course Cards & Badges --- */}
        <Row>
            {/* --- Left Column: Enhanced Course Cards --- */}
            <Col lg={8}>
                <h2 className="mb-4 fw-bold" style={{ color: '#2c3e50', fontSize: '1.8rem' }}>
                     My Enrolled Courses
                </h2>
                {enrolledCourses.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                        {enrolledCourses.map(enrollment => {
                            const progress = enrollment.total_lessons > 0 ? (enrollment.completed_lessons / enrollment.total_lessons) * 100 : 0;
                            const isCompleted = progress === 100;
                            const courseDetailLink = `/courses/${enrollment.course_id}`;
                            const resumeLink = enrollment.resumeLessonId ? `/courses/${enrollment.course_id}/lessons/${enrollment.resumeLessonId}` : courseDetailLink;
                            
                            return (
                                <Card 
                                    key={enrollment.course_id} 
                                    className="shadow-sm border-0"
                                    style={{
                                        background: '#fafbfc',
                                        borderRadius: '12px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
                                        e.currentTarget.style.border = '1px solid #007bff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0px)';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.border = 'none';
                                    }}
                                >
                                    <Row className="g-0 align-items-center">
                                        <Col md={3} className="d-flex align-items-center justify-content-center p-3">
                                            <Link to={courseDetailLink}>
                                                <Card.Img 
                                                    src={enrollment.thumbnail_url || 'https://placehold.co/600x400'} 
                                                    style={{ 
                                                        height: '120px', 
                                                        width: '160px',
                                                        objectFit: 'cover', 
                                                        borderRadius: '8px',
                                                        transition: 'transform 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.transform = 'scale(1)';
                                                    }}
                                                />
                                            </Link>
                                        </Col>
                                        <Col md={9}>
                                            <Card.Body className="d-flex flex-column justify-content-between h-100 p-3">
                                                <div>
                                                    <Card.Title as="h5" className="fw-bold mb-3" style={{ color: '#2c3e50', fontSize: '1.2rem' }}>
                                                        {enrollment.course_title}
                                                    </Card.Title>
                                                    
                                                    <div className="mb-3">
                                                        <div className="d-flex justify-content-between text-muted small mb-2">
                                                            <span className="fw-semibold">Progress</span>
                                                            <span className="fw-semibold">{enrollment.completed_lessons} / {enrollment.total_lessons}</span>
                                                        </div>
                                                        <ProgressBar 
                                                            now={progress} 
                                                            label={`${Math.round(progress)}%`} 
                                                            className="mb-2"
                                                            style={{ height: '10px', width: '85%' }}
                                                            variant={isCompleted ? 'success' : 'primary'}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <Button 
                                                        as={Link} 
                                                        to={courseDetailLink} 
                                                        variant={isCompleted ? "success" : "secondary"}
                                                        size="sm"
                                                        className="px-3"
                                                    >
                                                        {isCompleted ? 'Completed' : 'View'}
                                                    </Button>
                                                    <Button 
                                                        as={Link} 
                                                        to={resumeLink} 
                                                        variant="primary" 
                                                        size="sm"
                                                        className="px-3"
                                                    >
                                                        <PlayCircleFill className="me-1" />
                                                        {progress === 100 ? 'Review' : 'Resume'}
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Col>
                                    </Row>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Alert variant="info">You are not yet enrolled in any courses. <Link to="/courses">Explore courses</Link> to get started!</Alert>
                )}
            </Col>

            {/* --- Right Column: Enhanced Badges Earned --- */}
            <Col lg={4}>
                <h2 className="mb-4 fw-bold" style={{ color: '#2c3e50', fontSize: '1.8rem' }}>
                    🏅 Badges Earned
                </h2>
                {achievements.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                        {achievements.map(achId => {
                            const achievement = achievementMap[achId];
                            if (!achievement) return null;
                            return (
                                <Card 
                                    key={achId} 
                                    body 
                                    className="d-flex flex-row align-items-center p-3 border-0" 
                                    style={{ 
                                        background: `linear-gradient(135deg, ${achievement.color}15, ${achievement.color}25)`,
                                        borderLeft: `4px solid ${achievement.color}`,
                                        minHeight: '80px',
                                        borderRadius: '12px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateX(5px)';
                                        e.currentTarget.style.boxShadow = `0 5px 15px ${achievement.color}30`;
                                        e.currentTarget.style.borderLeft = `6px solid ${achievement.color}`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateX(0px)';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.borderLeft = `4px solid ${achievement.color}`;
                                    }}
                                >
                                    <div 
                                        className="me-3 d-flex align-items-center justify-content-center rounded-circle"
                                        style={{
                                            backgroundColor: achievement.color,
                                            color: 'white',
                                            width: '50px',
                                            height: '50px',
                                            fontSize: '1.5rem'
                                        }}
                                    >
                                        {achievement.icon}
                                    </div>
                                    <div>
                                        <div className="fw-bold" style={{ color: achievement.color, fontSize: '1.1rem' }}>
                                            {achievement.title}
                                        </div>
                                        <small className="fw-semibold" style={{ color: '#6c757d' }}>
                                            Achievement Unlocked
                                        </small>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Alert variant="light" className="text-center">
                        <div className="fs-1 mb-2">🏅</div>
                        <strong>No badges yet!</strong>
                        <br />
                        <small>Complete your first course to unlock achievements!</small>
                    </Alert>
                )}
            </Col>
        </Row>

        {/* --- Enhanced Recommendations Section --- */}
        <div className="my-5">
             <h2 className="mb-4 fw-bold" style={{ color: '#2c3e50', fontSize: '1.8rem' }}>
                🎯 Recommended For You
             </h2>
             {recommendations.length > 0 ? (
                 <Row>
                     {recommendations.map(course => (
                         <Col md={4} key={course.id} className="mb-3">
                              <Card 
                                className="h-100 shadow-sm border-0"
                                style={{
                                    borderRadius: '12px',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0px)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                              >
                                  <Link to={`/courses/${course.id}`}>
                                    <Card.Img 
                                        variant="top" 
                                        src={course.thumbnail_url || 'https://placehold.co/600x400'} 
                                        style={{ 
                                            height: '180px', 
                                            objectFit: 'cover',
                                            borderRadius: '12px 12px 0 0',
                                            transition: 'transform 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'scale(1)';
                                        }}
                                    />
                                  </Link>
                                  <Card.Body>
                                      <Card.Title as="h5" className="fw-bold">{course.title}</Card.Title>
                                      <Button 
                                        as={Link} 
                                        to={`/courses/${course.id}`} 
                                        variant="primary" 
                                        className="mt-3 w-100"
                                        size="sm"
                                      >
                                        View Course
                                      </Button>
                                  </Card.Body>
                              </Card>
                         </Col>
                     ))}
                 </Row>
             ) : <Alert variant="light">Enroll in a few courses to get personalized recommendations.</Alert>}
        </div>
    </div>
    );
};
// --- The Final, Enhanced Instructor Dashboard Component ---
const InstructorDashboard = ({ data }) => {
    const [courses, setCourses] = useState(data);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('success'); // 'success' or 'error'
    const [modalMessage, setModalMessage] = useState('');

    useEffect(() => { setCourses(data); }, [data]);

    // Handler functions
    const handleDelete = async (courseId) => {
        const token = localStorage.getItem('token');
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        
        try {
            await axios.delete(`${API_URL}/api/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove the deleted course from state
            setCourses(prev => prev.filter(course => course.course_id !== courseId));
            setModalMessage('Course deleted successfully');
            setModalType('success');
            setShowModal(true);
        } catch (error) {
            console.error('Delete error:', error);
            setModalMessage('Failed to delete course');
            setModalType('error');
            setShowModal(true);
        }
    };

    const handleStatusToggle = async (courseId, currentStatus) => {
        const token = localStorage.getItem('token');
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        
        try {
            await axios.patch(`${API_URL}/api/courses/${courseId}/status`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update the course status in state
            setCourses(prev => prev.map(course => 
                course.course_id === courseId 
                    ? { ...course, status: newStatus }
                    : course
            ));
            setModalMessage(`Course ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
            setModalType('success');
            setShowModal(true);
        } catch (error) {
            console.error('Status update error:', error);
            setModalMessage('Failed to update course status');
            setModalType('error');
            setShowModal(true);
        }
    };

    // Calculate analytics
    const totalCourses = courses.length;
    const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrollment_count || 0), 0);
    const totalCompletions = courses.reduce((sum, course) => sum + (course.completion_count || 0), 0);
    const totalLessons = courses.reduce((sum, course) => sum + (course.lesson_count || 0), 0);
    const overallCompletionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

    return (
        <>
            <div>
            {/* --- Enhanced Welcome Header --- */}
            <h1 className="mb-5 fw-bold" style={{ 
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '2.5rem'
            }}>
                Welcome to your Dashboard, Instructor!
            </h1>

            {/* --- Enhanced Teaching Analytics Section --- */}
            <h2 className="mb-4 fw-bold" style={{ color: '#2c3e50', fontSize: '1.8rem' }}>
                Teaching Analytics
            </h2>
            <Row className="mb-5 g-3">
                <Col lg={3} md={6}>
                    <Card 
                        body 
                        className="text-center h-100 border-0"
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.15)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0px)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.15)';
                        }}
                    >
                        <div 
                            className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                            style={{
                                width: '70px',
                                height: '70px',
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                borderRadius: '50%',
                                fontSize: '2rem'
                            }}
                        >
                            📚
                        </div>
                        <h3 className="fw-bold mb-1" style={{ color: '#667eea', fontSize: '2rem' }}>
                            {totalCourses}
                        </h3>
                        <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                            Total Courses
                        </p>
                    </Card>
                </Col>
                
                <Col lg={3} md={6}>
                    <Card 
                        body 
                        className="text-center h-100 border-0"
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 4px 15px rgba(240, 147, 251, 0.15)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(240, 147, 251, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0px)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(240, 147, 251, 0.15)';
                        }}
                    >
                        <div 
                            className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                            style={{
                                width: '70px',
                                height: '70px',
                                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                                borderRadius: '50%',
                                fontSize: '2rem'
                            }}
                        >
                            👥
                        </div>
                        <h3 className="fw-bold mb-1" style={{ color: '#f093fb', fontSize: '2rem' }}>
                            {totalEnrollments}
                        </h3>
                        <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                            Total Enrollments
                        </p>
                    </Card>
                </Col>
                
                <Col lg={3} md={6}>
                    <Card 
                        body 
                        className="text-center h-100 border-0"
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 4px 15px rgba(79, 172, 254, 0.15)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(79, 172, 254, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0px)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.15)';
                        }}
                    >
                        <div 
                            className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                            style={{
                                width: '70px',
                                height: '70px',
                                background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                                borderRadius: '50%',
                                fontSize: '2rem'
                            }}
                        >
                            📖
                        </div>
                        <h3 className="fw-bold mb-1" style={{ color: '#4facfe', fontSize: '2rem' }}>
                            {totalLessons}
                        </h3>
                        <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                            Total Lessons
                        </p>
                    </Card>
                </Col>
                
                <Col lg={3} md={6}>
                    <Card 
                        body 
                        className="text-center h-100 border-0"
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 4px 15px rgba(40, 167, 69, 0.15)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(40, 167, 69, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0px)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.15)';
                        }}
                    >
                        <div 
                            className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                            style={{
                                width: '70px',
                                height: '70px',
                                background: 'linear-gradient(135deg, #28a745, #20c997)',
                                borderRadius: '50%',
                                fontSize: '2rem'
                            }}
                        >
                            ✅
                        </div>
                        <h3 className="fw-bold mb-1" style={{ color: '#28a745', fontSize: '2rem' }}>
                            {overallCompletionRate.toFixed(1)}%
                        </h3>
                        <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                            Completion Rate
                        </p>
                    </Card>
                </Col>
            </Row>

            {/* --- Enhanced My Courses Section with Horizontal Layout --- */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold" style={{ color: '#2c3e50', fontSize: '1.8rem' }}>
                    My Courses
                </h2>
                <div className="d-flex gap-2">
                    <Button as={Link} to="/instructor/discussions" variant="primary">
                        <ChatDots className="me-2" />
                        Manage Course Questions
                    </Button>
                    <Button 
                        as={Link} 
                        to="/create-course" 
                        variant="primary"
                        style={{
                            borderRadius: '10px',
                            padding: '10px 20px',
                            fontWeight: 'bold'
                        }}
                    >
                        Create New Course
                    </Button>
                </div>
            </div>
            
            {/* --- Horizontal Course Cards with Horizontal Buttons --- */}
            <div className="d-flex flex-column gap-4">
                {courses.map(course => {
                    const completionRate = course.enrollment_count > 0 ? (course.completion_count / course.enrollment_count) * 100 : 0;
                    return (
                        <Card 
                            key={course.course_id} 
                            className="shadow-sm border-0"
                            style={{
                                background: '#fafbfc',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
                                e.currentTarget.style.border = '1px solid #007bff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0px)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                e.currentTarget.style.border = 'none';
                            }}
                        >
                            <Row className="g-0 align-items-center">
                                {/* --- Image Column --- */}
                                <Col md={3} className="d-flex align-items-center justify-content-center p-3">
                                    <Card.Img 
                                        src={course.thumbnail_url || 'https://placehold.co/600x400'} 
                                        style={{ 
                                            height: '120px', 
                                            width: '160px',
                                            objectFit: 'cover', 
                                            borderRadius: '8px',
                                            transition: 'transform 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'scale(1)';
                                        }}
                                    />
                                </Col>
                                
                                {/* --- Content Column --- */}
                                <Col md={9}>
                                    <Card.Body className="p-4">
                                        <Card.Title as="h5" className="fw-bold mb-2" style={{ color: '#2c3e50', fontSize: '1.2rem' }}>
                                            {course.course_title}
                                        </Card.Title>
                                        
                                        {/* Status Badge */}
                                        <div className="mb-3">
                                            <span 
                                                className={`badge px-3 py-1 ${course.status === 'published' ? 'bg-success' : 'bg-secondary'}`}
                                                style={{ borderRadius: '15px', fontSize: '0.8rem' }}
                                            >
                                                {course.status === 'published' ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                        
                                        {/* Stats */}
                                        <div className="d-flex gap-4 text-muted small mb-3">
                                            <span className="fw-semibold">
                                                <PeopleFill className="me-1" style={{ color: '#007bff' }} /> 
                                                {course.enrollment_count} Enrolled
                                            </span>
                                            <span className="fw-semibold">
                                                <PatchCheckFill className="me-1" style={{ color: '#28a745' }} /> 
                                                {course.completion_count} Completed
                                            </span>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between text-muted small mb-1">
                                                <span className="fw-semibold">Completion Rate</span>
                                                <span className="fw-semibold">{Math.round(completionRate)}%</span>
                                            </div>
                                            <ProgressBar 
                                                now={completionRate} 
                                                variant="success" 
                                                style={{ height: '8px', width: '85%' }}
                                            />
                                        </div>
                                        
                                        {/* Action Buttons - All in a horizontal line */}
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Button 
                                                as={Link} 
                                                to={`/manage-course/${course.course_id}`} 
                                                variant="primary" 
                                                size="sm"
                                                style={{ borderRadius: '6px', fontWeight: '500' }}
                                            >
                                                Manage Lessons
                                            </Button>
                                            <Button 
                                                as={Link} 
                                                to={`/edit-course/${course.course_id}`} 
                                                variant="secondary" 
                                                size="sm"
                                                style={{ borderRadius: '6px', fontWeight: '500' }}
                                            >
                                                Edit
                                            </Button>
                                            <Button 
                                                onClick={() => handleStatusToggle(course.course_id, course.status)}
                                                variant={course.status === 'published' ? 'warning' : 'success'}
                                                size="sm"
                                                style={{ borderRadius: '6px', fontWeight: '500' }}
                                            >
                                                {course.status === 'published' ? 'Unpublish' : 'Publish'}
                                            </Button>
                                            <Button 
                                                onClick={() => handleDelete(course.course_id)}
                                                variant="danger" 
                                                size="sm"
                                                style={{ borderRadius: '6px', fontWeight: '500' }}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Col>
                            </Row>
                        </Card>
                    );
                })}
            </div>
            </div>

        {/* Success/Error Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton style={{ backgroundColor: modalType === 'success' ? '#d4edda' : '#f8d7da', borderBottom: modalType === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb' }}>
                <Modal.Title style={{ color: modalType === 'success' ? '#155724' : '#721c24', fontWeight: 'bold' }}>
                    {modalType === 'success' ? '✅ Success' : '❌ Error'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ color: modalType === 'success' ? '#155724' : '#721c24', fontSize: '1.1rem' }}>
                {modalMessage}
            </Modal.Body>
            <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
                <Button variant={modalType === 'success' ? 'success' : 'danger'} onClick={() => setShowModal(false)} style={{ borderRadius: '8px' }}>
                    OK
                </Button>
            </Modal.Footer>
        </Modal>
        </>
    );
};
// --- Main Dashboard Page Component (No changes needed) ---
function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, isAuthLoading } = useContext(AuthContext);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) { setLoading(false); return; }

        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
                setDashboardData(response.data);
            } catch (err) {
                setError("Could not load your dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user, isAuthLoading]);

    if (isAuthLoading || loading) {
        return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    }
    
    if (!user) {
        return (
            <Container className="my-5 text-center">
                <Alert variant="warning">Please <Link to="/login">log in</Link> to view your dashboard.</Alert>
            </Container>
        )
    }

    if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!dashboardData) return <Container className="text-center my-5"><p>Loading dashboard...</p></Container>;

    return (
        <Container className="my-5">
            {user?.role === 'student' ? (
                <StudentDashboard data={dashboardData} userName={user?.username} />
            ) : user?.role === 'instructor' ? (
                <InstructorDashboard data={dashboardData} />
            ) : (
                <p>Your dashboard is being prepared. Please check back later.</p>
            )}
        </Container>
    );
}

export default Dashboard;