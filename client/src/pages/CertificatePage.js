import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { AwardFill, Download } from 'react-bootstrap-icons';
import axios from 'axios';
import jsPDF from 'jspdf'; // Import the new PDF library

const API_URL = "http://localhost:5000";

function CertificatePage() {
    const { courseId } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const certificateRef = useRef(null); // Create a ref to access the certificate's HTML element

    useEffect(() => {
        const fetchCertificate = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await axios.get(`${API_URL}/api/certificates/course/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCertificate(response.data);
            } catch (err) {
                setError("Could not load certificate. Please ensure you have completed the course and generated the certificate.");
            } finally {
                setLoading(false);
            }
        };
        fetchCertificate();
    }, [courseId]);

    // --- This function handles downloading the certificate as a PDF ---
    const handleDownloadPdf = () => {
        // Create a new PDF document in landscape mode
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [certificateRef.current.offsetWidth + 20, certificateRef.current.offsetHeight + 20] // Add padding
        });
        
        // Use the html method to render the certificate card into the PDF
        doc.html(certificateRef.current, {
            callback: function(pdf) {
                // Save the generated PDF
                pdf.save(`${certificate.username}-${certificate.course_title}-certificate.pdf`);
            },
            x: 10, // Add horizontal padding
            y: 10  // Add vertical padding
        });
    };

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!certificate) return null;

    return (
        <Container className="my-5">
            {/* The ref is attached to this Card element so we can capture it for the PDF */}
            <Card className="text-center shadow-lg" ref={certificateRef} style={{ border: "10px solid #0d6efd", fontFamily: 'serif' }}>
                <Card.Header className="bg-primary text-white" style={{ padding: '2rem', borderBottom: '5px solid #0a58ca' }}>
                    <h1 className="my-2"><AwardFill /> Certificate of Completion</h1>
                </Card.Header>
                <Card.Body className="p-5">
                    <p className="lead fs-4">This certifies that</p>
                    <h2 className="display-4 text-primary my-4">{certificate.username}</h2>
                    <p className="lead fs-4">has successfully completed the course</p>
                    <h3 className="my-4">"{certificate.course_title}"</h3>
                    <p className="text-muted mt-5">
                        Issued on: {new Date(certificate.issued_at).toLocaleDateString()}
                        <br />
                        Certificate ID: {certificate.certificate_uid}
                    </p>
                </Card.Body>
                <Card.Footer className="text-muted" style={{ padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.03)' }}>
                    <p className="mb-0 fw-bold">EduLearnPro</p>
                </Card.Footer>
            </Card>
            <div className="text-center mt-4 d-print-none">
                <Button variant="outline-secondary" className="me-2" as={Link} to={`/courses/${courseId}`}>Back to Course</Button>
                <Button variant="primary" onClick={handleDownloadPdf}>
                    <Download className="me-2" /> Download as PDF
                </Button>
            </div>
        </Container>
    );
}

export default CertificatePage;

