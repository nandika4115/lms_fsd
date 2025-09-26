import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import { Download } from 'react-bootstrap-icons';
import axios from 'axios';
import jsPDF from 'jspdf';
import './Certificate.css';

const API_URL = "http://localhost:5000";

function CertificatePage() {
    const { courseId } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const certificateRef = useRef(null);

    useEffect(() => {
        const fetchCertificate = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await axios.get(`${API_URL}/api/certificates/course/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCertificate(response.data);
            } catch (err) {
                setError("Could not load certificate. Please ensure you have completed the course.");
            } finally {
                setLoading(false);
            }
        };
        fetchCertificate();
    }, [courseId]);

    const handleDownloadPdf = () => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [certificateRef.current.offsetWidth + 60, certificateRef.current.offsetHeight + 60]
        });

        doc.html(certificateRef.current, {
            callback: function(pdf) {
                pdf.save(`${certificate.username}-${certificate.course_title}-certificate.pdf`);
            },
            x: 30,
            y: 30,
            html2canvas: {
                scale: 0.7,
                backgroundColor: '#ffffff',
                useCORS: true
            }
        });
    };

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!certificate) return null;

    return (
        <Container className="my-5">
            <div className="certificate-container" ref={certificateRef}>
                <div className="certificate-geometric-bg"></div> 
                
                <div className="certificate-content">
                    <div className="certificate-header">
                        <h1 className="certificate-title">CERTIFICATE OF COMPLETION</h1>
                        {/* Removed: <div className="certificate-award-icon"></div> */}
                    </div>
                    
                    <div className="certificate-body">
                        <p className="certify-text">This certifies that</p>
                        <h2 className="recipient-name">{certificate.first_name} {certificate.last_name}</h2>
                        <p className="certify-text">has successfully completed the course</p>
                        <h3 className="course-title">"{certificate.course_title}"</h3>
                    </div>

                    <div className="certificate-footer">
                        <div className="issue-details">
                            <span className="detail-label">Issued on:</span> {new Date(certificate.issued_at).toLocaleDateString()}
                        </div>
                        <div className="org-signature">
                            EduLearnPro
                        </div>
                        <div className="cert-id-details">
                            <span className="detail-label">Certificate ID:</span> {certificate.certificate_uid}
                        </div>
                    </div>
                </div>
            </div>

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