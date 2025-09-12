import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API_URL = "http://localhost:5000";

// This custom hook centralizes all the logic for enrolling in a course.
export const useEnrollment = () => {
    // State to manage per-course status messages (e.g., "Enrolling...", "Success")
    const [enrollmentStatus, setEnrollmentStatus] = useState({});
    
    // Get the global addEnrollment function from our AuthContext
    const { addEnrollment } = useContext(AuthContext);
    const navigate = useNavigate();

    // This is the main function that components will call
    const handleEnroll = async (courseId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login'); // Redirect to login if not authenticated
            return;
        }

        // Set a loading message for this specific course
        setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: 'Enrolling...', type: 'info' } }));
        
        try {
            // Make the API call to the correct endpoint
            const response = await axios.post(
                `${API_URL}/api/enrollments/${courseId}`, 
                {}, // The body is empty
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // On success, update the status and the global state
            setEnrollmentStatus(prev => ({ ...prev, [courseId]: { message: response.data.message, type: 'success' } }));
            addEnrollment(courseId);

        } catch (err) {
            // On failure, show an error message
            setEnrollmentStatus(prev => ({ 
                ...prev, 
                [courseId]: { message: err.response?.data?.message || `Failed to enroll.`, type: 'danger' } 
            }));
        }
    };

    // Return the function and the status object so components can use them
    return { handleEnroll, enrollmentStatus };
};

