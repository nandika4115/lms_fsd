import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button, Offcanvas } from 'react-bootstrap';
import { List } from 'react-bootstrap-icons';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage'; // ✨ Import the new CoursesPage component
import AuthContext from './context/AuthContext';

// --- Sidebar (Offcanvas) Component ---
function AppSidebar({ show, handleClose }) {
  return (
    <Offcanvas show={show} onHide={handleClose}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Menu</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Nav className="flex-column">
          <Nav.Link as={Link} to="/" onClick={handleClose}>Home</Nav.Link>
          <Nav.Link as={Link} to="/courses" onClick={handleClose}>Explore Courses</Nav.Link>
          <Nav.Link as={Link} to="/about" onClick={handleClose}>About Us</Nav.Link>
          <Nav.Link as={Link} to="/contact" onClick={handleClose}>Contact</Nav.Link>
          <hr />
          <Nav.Link as={Link} to="/profile" onClick={handleClose}>Profile</Nav.Link>
        </Nav>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

// --- Navbar Component ---
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
      <Navbar bg="dark" variant="dark" expand={false} className="shadow-sm">
        <Container>
          <Button variant="dark" onClick={handleSidebarShow} className="me-2">
            <List size={24} />
          </Button>
          <Navbar.Brand as={Link} to="/">EduLearnPro</Navbar.Brand>
          <Nav className="ms-auto">
            {user ? (
              <div className="d-flex align-items-center">
                <Button as={Link} to="/dashboard" variant="outline-light" size="sm" className="me-2">Dashboard</Button>
                <Button variant="danger" size="sm" onClick={handleLogout}>Logout</Button>
              </div>
            ) : (
              <Button as={Link} to="/login" variant="primary" size="sm">Login</Button>
            )}
          </Nav>
        </Container>
      </Navbar>
      <AppSidebar show={showSidebar} handleClose={handleSidebarClose} />
    </>
  );
}

// --- App Content Component ---
function AppContent() {
  const location = useLocation();
  const showNav = !['/login', '/register'].includes(location.pathname);

  return (
    <>
      {showNav && <AppNavbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<CoursesPage />} /> {/* ✨ Add the new route */}
        {/* Add routes for other pages like /about etc. here */}
      </Routes>
    </>
  );
}

// --- Main App Component ---
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

