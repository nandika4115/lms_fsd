import React, { useEffect, useState } from 'react';
import API_URL from '../config';
import axios from 'axios';
import { Container, Row, Col, Card, ListGroup, Button, Modal } from 'react-bootstrap';

const AdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState(null);
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [adminName] = useState(localStorage.getItem('adminName') || 'Admin');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchAdmins();
    fetchUsers('instructor');
    fetchUsers('student');
    fetchPendingInstructors();
    fetchStats();
    fetchAnnouncements();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/admins`, { headers: { Authorization: `Bearer ${token}` } });
      setAdmins(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async (role) => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users?role=${role}`, { headers: { Authorization: `Bearer ${token}` } });
      if (role === 'instructor') setInstructors(res.data);
      else setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingInstructors = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users?role=pending_instructor`, { headers: { Authorization: `Bearer ${token}` } });
      setPendingInstructors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const approveUser = async (id) => {
    try {
      await axios.post(`${API_URL}/api/admin/users/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchPendingInstructors();
      fetchUsers('instructor');
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectUser = async (id) => {
    try {
      await axios.post(`${API_URL}/api/admin/users/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchPendingInstructors();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (id, username) => {
    setDeleteTarget({ id, username });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/admin/users/${deleteTarget.id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers('instructor');
      fetchUsers('student');
      fetchStats();
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setModalMessage(`${deleteTarget.username} has been deleted successfully.`);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setModalMessage('Failed to delete user');
      setShowErrorModal(true);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/announcements`, { headers: { Authorization: `Bearer ${token}` } });
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminName');
    window.location.href = '/login';
  };

  return (
    <Container className="my-5">
      {/* --- Welcome Header --- */}
      <h1 className="mb-5 fw-bold" style={{ 
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontSize: '2.5rem'
      }}>
        Welcome to Admin Panel!
      </h1>

      {/* --- Admin Stats Section --- */}
      <h2 className="mb-4 fw-bold" style={{ color: '#2c3e50', fontSize: '1.8rem' }}>
        Platform Overview
      </h2>
      <Row className="mb-5 g-3">
        {/* Students Card */}
        <Col md={3}>
          <Card 
            body 
            className="text-center h-100 border-0"
            style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 15px rgba(240, 147, 251, 0.15)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
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
              {stats?.totalStudents || 0}
            </h3>
            <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>
              Students
            </p>
          </Card>
        </Col>

        {/* Instructors Card */}
        <Col md={3}>
          <Card 
            body 
            className="text-center h-100 border-0"
            style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.15)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
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
              ✅
            </div>
            <h3 className="fw-bold mb-1" style={{ color: '#667eea', fontSize: '2rem' }}>
              {stats?.totalInstructors || 0}
            </h3>
            <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>
              Instructors
            </p>
          </Card>
        </Col>

        {/* Pending Instructors Card */}
        <Col md={3}>
          <Card 
            body 
            className="text-center h-100 border-0"
            style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 15px rgba(255, 159, 64, 0.15)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 159, 64, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 159, 64, 0.15)';
            }}
          >
            <div 
              className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{
                width: '70px',
                height: '70px',
                background: 'linear-gradient(135deg, #ff9f40, #ffa500)',
                borderRadius: '50%',
                fontSize: '2rem'
              }}
            >
              ⏳
            </div>
            <h3 className="fw-bold mb-1" style={{ color: '#ff9f40', fontSize: '2rem' }}>
              {stats?.pendingInstructors || 0}
            </h3>
            <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>
              Pending Approval
            </p>
          </Card>
        </Col>

        {/* Courses Card */}
        <Col md={3}>
          <Card 
            body 
            className="text-center h-100 border-0"
            style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.15)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
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
              📚
            </div>
            <h3 className="fw-bold mb-1" style={{ color: '#4facfe', fontSize: '2rem' }}>
              {stats?.totalCourses || 0}
            </h3>
            <p className="mb-0 fw-semibold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>
              Courses
            </p>
          </Card>
        </Col>
      </Row>

      {/* --- Two Column Layout: Users & Pending --- */}
      <Row className="mb-5">
        {/* Left Column: Instructors & Students */}
        <Col lg={8}>
          {/* Instructors Section */}
          <div className="mb-5">
            <h2 className="mb-4 fw-bold" style={{ color: '#2c3e50', fontSize: '1.8rem' }}>
              👨‍🏫 Instructors
            </h2>
            <div className="d-flex flex-column gap-3">
              {instructors.length > 0 ? (
                instructors.map((u) => (
                  <Card 
                    key={u.id} 
                    className="border-0"
                    style={{
                      background: '#fafbfc',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <Card.Body className="d-flex justify-content-between align-items-center p-3">
                      <div>
                        <Card.Title className="fw-bold mb-1" style={{ color: '#2c3e50' }}>
                          {u.username}
                        </Card.Title>
                        <Card.Text className="text-muted small mb-0">
                          {u.email}
                        </Card.Text>
                      </div>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeleteClick(u.id, u.username)}
                        style={{
                          borderRadius: '8px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        Delete
                      </Button>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">No instructors yet</p>
              )}
            </div>
          </div>

          {/* Students Section */}
          <div>
            <h2 className="mb-4 fw-bold" style={{ color: '#2c3e50', fontSize: '1.8rem' }}>
              👨‍🎓 Students
            </h2>
            <div className="d-flex flex-column gap-3">
              {students.length > 0 ? (
                students.map((u) => (
                  <Card 
                    key={u.id} 
                    className="border-0"
                    style={{
                      background: '#fafbfc',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(240, 147, 251, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <Card.Body className="d-flex justify-content-between align-items-center p-3">
                      <div>
                        <Card.Title className="fw-bold mb-1" style={{ color: '#2c3e50' }}>
                          {u.username}
                        </Card.Title>
                        <Card.Text className="text-muted small mb-0">
                          {u.email}
                        </Card.Text>
                      </div>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeleteClick(u.id, u.username)}
                        style={{
                          borderRadius: '8px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        Delete
                      </Button>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">No students yet</p>
              )}
            </div>
          </div>
        </Col>

        {/* Right Column: Pending Instructor Approvals */}
        <Col lg={4}>
          <h2 className="mb-4 fw-bold" style={{ color: '#2c3e50', fontSize: '1.8rem' }}>
            ⏳ Pending Approvals
          </h2>
          <div className="d-flex flex-column gap-3">
            {pendingInstructors.length > 0 ? (
              pendingInstructors.map((p) => (
                <Card 
                  key={p.id} 
                  className="border-0"
                  style={{
                    background: 'linear-gradient(135deg, #ff9f4015, #ffa50015)',
                    borderLeft: '4px solid #ff9f40',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(5px)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(255, 159, 64, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0px)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Card.Body className="p-3">
                    <Card.Title className="fw-bold mb-1" style={{ color: '#2c3e50' }}>
                      {p.username}
                    </Card.Title>
                    <Card.Text className="text-muted small mb-3">
                      {p.email}
                    </Card.Text>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="success" 
                        size="sm" 
                        onClick={() => approveUser(p.id)}
                        className="flex-grow-1"
                        style={{ borderRadius: '8px' }}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => rejectUser(p.id)}
                        className="flex-grow-1"
                        style={{ borderRadius: '8px' }}
                      >
                        Reject
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted p-4" style={{ background: '#f8f9fa', borderRadius: '12px' }}>
                No pending approvals
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* --- Announcements Section --- */}
      <Row className="mt-5">
        <Col>
          <h2 className="mb-4 fw-bold" style={{ color: '#2c3e50', fontSize: '1.8rem' }}>
            📢 Announcements
          </h2>
          <div className="d-flex flex-column gap-3">
            {announcements.length > 0 ? (
              announcements.map((x) => (
                <Card 
                  key={x._id} 
                  className="border-0"
                  style={{
                    background: 'linear-gradient(135deg, #667eea15, #764ba215)',
                    borderLeft: '4px solid #667eea',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(5px)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0px)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Card.Body className="p-3">
                    <Card.Title className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
                      {x.title}
                    </Card.Title>
                    <Card.Text className="mb-2">{x.content}</Card.Text>
                    <Card.Text className="text-muted small">
                      by {x.createdBy} — {new Date(x.createdAt).toLocaleString()}
                    </Card.Text>
                  </Card.Body>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted p-4" style={{ background: '#f8f9fa', borderRadius: '12px' }}>
                No announcements yet
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* --- Delete Confirmation Modal ---
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
          <Modal.Title style={{ color: '#2c3e50', fontWeight: 'bold' }}>
            ⚠️ Delete User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: '#495057', fontSize: '1.1rem' }}>
          Are you sure you want to delete <strong>{deleteTarget?.username}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} style={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} style={{ borderRadius: '8px' }}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#d4edda', borderBottom: '1px solid #c3e6cb' }}>
          <Modal.Title style={{ color: '#155724', fontWeight: 'bold' }}>
            ✅ Success
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: '#155724', fontSize: '1.1rem' }}>
          {modalMessage}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
          <Button variant="success" onClick={() => setShowSuccessModal(false)} style={{ borderRadius: '8px' }}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Error Modal */}
      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#f8d7da', borderBottom: '1px solid #f5c6cb' }}>
          <Modal.Title style={{ color: '#721c24', fontWeight: 'bold' }}>
            ❌ Error
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: '#721c24', fontSize: '1.1rem' }}>
          {modalMessage}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
          <Button variant="danger" onClick={() => setShowErrorModal(false)} style={{ borderRadius: '8px' }}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
