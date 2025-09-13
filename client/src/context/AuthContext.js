import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const API_URL = "http://localhost:5000";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // This single, simple effect runs once when the app loads.
    // It checks localStorage for a token and sets the user state.
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedUser = jwtDecode(token);
                // Check if the token is expired
                if (decodedUser.exp * 1000 > Date.now()) {
                    setUser(decodedUser);
                } else {
                    // Token is expired, remove it
                    localStorage.removeItem('token');
                }
            } catch (error) {
                // Token is invalid, remove it
                localStorage.removeItem('token');
            }
        }
        setIsAuthLoading(false); // Finished checking
    }, []);

    // This effect runs whenever the user state changes (e.g., after login).
    // It fetches the user's enrollments.
    useEffect(() => {
        const fetchEnrollments = async () => {
            const token = localStorage.getItem('token');
            if (user && user.role === 'student' && token) {
                try {
                    const response = await axios.get(`${API_URL}/api/enrollments`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setEnrolledCourseIds(new Set(response.data.map(course => course.id)));
                } catch (error) {
                    console.error("Could not fetch enrollments:", error);
                }
            } else {
                setEnrolledCourseIds(new Set()); // Clear enrollments if user logs out
            }
        };
        fetchEnrollments();
    }, [user]);

    const login = (token) => {
        localStorage.setItem('token', token);
        setUser(jwtDecode(token));
    };

    const logout = (callback) => {
        localStorage.removeItem('token');
        setUser(null);
        if (callback) callback();
    };

    const addEnrollment = (courseId) => {
        setEnrolledCourseIds(prevIds => new Set(prevIds).add(courseId));
    };

    const value = { user, isAuthLoading, login, logout, enrolledCourseIds, addEnrollment };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
