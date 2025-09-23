import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Image, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { CodeSlash, Brush, GraphUp } from 'react-bootstrap-icons';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import CourseCard from '../components/CourseCard'; // NEW

const API_URL = "http://localhost:5000";

// Icon Array for Pastel Cards (Order matches backgrounds)
const cardIcons = [
  <CodeSlash size={40} className="text-success" />,
  <GraphUp size={40} className="text-primary" />,
  <Brush size={40} className="text-warning" />
];

// --- ✨ Featured Courses Component (Now Uses CourseCard) ✨ ---
function FeaturedCourses() {
  const [courses, setCourses] = useState([]);
  const { user, enrolledCourseIds, addEnrollment } = useContext(AuthContext);
  const [enrollmentStatus, setEnrollmentStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      const token = localStorage.getItem('token');
      try {
          const response = await axios.get(`${API_URL}/api/courses`, {
          headers: { Authorization: `Bearer ${token}` } // Send the token
        });        
        setCourses(response.data.slice(0, 3));
      } catch (error) {
        console.error("Could not fetch featured courses:", error);
      }
    };
    fetchFeaturedCourses();
  }, []);

  // Same enrollment handler from CoursesPage
  const handleEnroll = async (courseId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: 'Enrolling...', type: 'info' } }));
    try {
      const response = await axios.post(
        `${API_URL}/api/enrollments/${courseId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: response.data.message, type: 'success' } }));
      addEnrollment(courseId); 
    } catch (err) {
      setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: err.response?.data?.message || `Failed to enroll.`, type: 'danger' } }));
    }
  };

  return (
    <div className="py-5">
      <Container>
        <h2 className="text-center fw-bold mb-5">Featured Courses</h2>
        <Row>
          {courses.map((course, index) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const status = enrollmentStatus[course.id];
            const resumeLink = course.resumeLessonId
              ? `/courses/${course.id}/lessons/${course.resumeLessonId}`
              : `/courses/${course.id}`;


            // Display thumbnail, icons, all per use case!
            return (
              <Col md={6} lg={4} key={course.id} className="mb-4">
                <CourseCard
                  course={course}
                  index={index}
                  isEnrolled={isEnrolled}
                  status={status}
                  user={user}
                  onEnroll={handleEnroll}
                  showResume={isEnrolled}
                  resumeLink={resumeLink}
                  showEnroll={!!user}
                  showDetails={true}
                  customIcon={cardIcons[index % cardIcons.length]}
                />
              </Col>
            );
          })}
        </Row>
      </Container>
    </div>
  );
}

// --- Main Homepage Component (Unchanged except card rendering) ---
function HomePage() {
  const { user } = useContext(AuthContext);

  return (
    <>
      <div className="hero-section text-white text-center">
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <h1 className="display-3 fw-bolder">Unlock Your Potential</h1>
              <p className="lead my-4">
                Join a community of learners and experts. Start your journey with EduLearnPro today and take your skills to the next level.
              </p>
              <Button as={Link} to="/courses" variant="light" size="lg">
                Explore Courses
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <div className="content-section-wrapper">
        <FeaturedCourses />

        <div className="about-section">
          <Container className="my-5 py-5">
            <Row className="align-items-center" id="about-us">
              <Col md={6} className="mb-4 mb-md-0">
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                  rounded
                  fluid
                  className="shadow-lg"
                  alt="Students collaborating and learning together"
                />
              </Col>
              <Col md={6}>
                <h2 className="fw-bold">About EduLearnPro</h2>
                <p className="text-muted">
                  We believe in a world where anyone, anywhere has the power to transform their life through learning. Our courses are curated and taught by industry experts who are passionate about sharing their knowledge.
                </p>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      {!user && (
        <div className="cta-section text-center py-5">
            <Container>
                <h2 className="fw-bold">Ready to Start Learning?</h2>
                <p className="text-muted my-3">Create an account to enroll in courses, track your progress, and join our community.</p>
                <Button as={Link} to="/register" variant="success" size="lg">
                    Sign Up for Free
                </Button>
            </Container>
        </div>
      )}
    </>
  );
}

export default HomePage;
