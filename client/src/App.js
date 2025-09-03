import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from "react-router-dom";
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// We create a new component for the navigation bar here
// This keeps the main App component clean
const AppNavbar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">EduLearnPro</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* You can add other links here if you want */}
            {/* <Nav.Link as={Link} to="/courses">Courses</Nav.Link> */}
          </Nav>
          <Nav>
            <Button as={Link} to="/login" variant="primary">Login</Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

// This component will contain the main logic
const AppContent = () => {
  const location = useLocation();

  // Add the paths of the pages where you DON'T want the navbar
  const noNavRoutes = ['/login', '/register'];

  // Check if the current path is in our list of no-navbar routes
  const showNav = !noNavRoutes.includes(location.pathname);

  return (
    <>
      {/* Conditionally render the Navbar */}
      {showNav && <AppNavbar />}

      {/* The Routes will render the correct page component */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
};


function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

