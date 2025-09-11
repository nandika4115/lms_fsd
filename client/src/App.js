import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button, Offcanvas, Image } from 'react-bootstrap';
import { List, HouseDoor, Book, InfoCircle, Envelope, PersonCircle, Grid1x2Fill, BoxArrowRight, BoxArrowInRight } from 'react-bootstrap-icons';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage';
import CourseDetail from './pages/CourseDetail';
import ProfilePage from './pages/ProfilePage';
import AppFooter from './components/AppFooter';
import AuthContext from './context/AuthContext';
import CreateCoursePage from './pages/CreateCoursePage';
// import ManageCoursePage from './pages/ManageCoursePage';
import ProtectedRoute from './components/ProtectedRoute';
import EditCoursePage from './pages/EditCoursePage';
import EditProfilePage from './pages/EditProfilePage'; // 1. Import the new page

// --- ✨ Sidebar (Offcanvas) Component (Updated Logic) ✨ ---
function AppSidebar({ show, handleClose }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogoutAndClose = () => {
    logout(() => navigate('/'));
    handleClose();
  };

  return (
    <Offcanvas show={show} onHide={handleClose} className="app-sidebar">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Menu</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Nav className="flex-column">
          {/* --- Public Links (Always visible) --- */}
          <Nav.Link as={Link} to="/" onClick={handleClose} className="sidebar-link d-flex align-items-center"><HouseDoor className="me-3" size={22} /> Home</Nav.Link>
          <Nav.Link as={Link} to="/courses" onClick={handleClose} className="sidebar-link d-flex align-items-center"><Book className="me-3" size={22} /> Explore Courses</Nav.Link>
          <Nav.Link as={Link} to="/#about-us" onClick={handleClose} className="sidebar-link d-flex align-items-center"><InfoCircle className="me-3" size={22} /> About Us</Nav.Link>
          <Nav.Link as={Link} to="/#footer-contact" onClick={handleClose} className="sidebar-link d-flex align-items-center"><Envelope className="me-3" size={22} /> Contact</Nav.Link>
          
          <hr className="sidebar-divider" />

          {/* --- User-Specific Links (Conditional) --- */}
          {user ? (
            // If user IS logged in, show these links
            <>
              <Nav.Link as={Link} to="/dashboard" onClick={handleClose} className="sidebar-link d-lg-none d-flex align-items-center">
                <Grid1x2Fill className="me-3" size={22} /> Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/profile" onClick={handleClose} className="sidebar-link d-flex align-items-center">
                <PersonCircle className="me-3" size={22} /> Profile
              </Nav.Link>
              <Nav.Link onClick={handleLogoutAndClose} className="sidebar-link d-lg-none d-flex align-items-center">
                <BoxArrowRight className="me-3" size={22} /> Logout
              </Nav.Link>
            </>
          ) : (
            // If user is NOT logged in, only show the responsive Login button
            <>
              <Nav.Link as={Link} to="/login" onClick={handleClose} className="sidebar-link d-lg-none d-flex align-items-center">
                <BoxArrowInRight className="me-3" size={22} /> Login
              </Nav.Link>
            </>
          )}
        </Nav>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

// --- Other Components (Unchanged) ---
function AppNavbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showSidebar, setShowSidebar] = useState(false);
    const handleSidebarClose = () => setShowSidebar(false);
    const handleSidebarShow = () => setShowSidebar(true);
    const handleLogout = () => {
        logout(() => navigate('/'));
    };
    return (
        <>
        <Navbar expand={false} className="app-navbar shadow-sm sticky-top">
            <Container fluid className="px-3 px-md-4">
              <div className="d-flex align-items-center">
                <Button onClick={handleSidebarShow} className="sidebar-toggle-btn me-3">
                    <List size={30} />
                </Button>
                <Navbar.Brand as={Link} to="/">EduLearnPro</Navbar.Brand>
              </div>
              <Nav>
                  {user ? (
                  <div className="d-none d-lg-flex align-items-center">
                      <Button as={Link} to="/dashboard" variant="light" className="me-3 dashboard-btn">Dashboard</Button>
                      <Button variant="danger" onClick={handleLogout} className="me-3">Logout</Button>
                      <Link to="/profile">
                          <Image 
                              src={user.profile_image_url || `https://placehold.co/40x40/FFFFFF/004D40?text=${user.username.charAt(0)}`} 
                                                           alt={`${user.username}'s profile`}
                              className="profile-avatar"
                          />
                      </Link>
                  </div>
                  ) : (
                  <div className="d-none d-lg-block">
                    <Button as={Link} to="/login" variant="primary" size="md">Login</Button>
                  </div>
                  )}
              </Nav>
            </Container>
        </Navbar>
        <AppSidebar show={showSidebar} handleClose={handleSidebarClose} />
        </>
    );
}
function ScrollHandler() {
    const location = useLocation();
    useEffect(() => {
        if (location.hash) {
            const timer = setTimeout(() => {
                const element = document.getElementById(location.hash.substring(1));
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
            return () => clearTimeout(timer);
        } else {
            window.scrollTo(0, 0);
        }
    }, [location]);
    return null;
}
function AppContent() {
  const location = useLocation();
  const showNavAndFooter = !['/login', '/register'].includes(location.pathname);

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      {showNavAndFooter && <AppNavbar />}
      <main className="flex-grow-1">
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route element={<ProtectedRoute requiredRole="instructor" />}>
                <Route path="/create-course" element={<CreateCoursePage />} />
                <Route path="/edit-course/:id" element={<EditCoursePage />} /> 
            </Route>
            <Route path="/profile/edit" element={<EditProfilePage />}/>
        </Routes>
      </main>
      {showNavAndFooter && <AppFooter />}
    </div>
  );
}
function App() {
  return (
    <Router>
      <ScrollHandler /> 
      <AppContent />
    </Router>
  );
}

export default App;

