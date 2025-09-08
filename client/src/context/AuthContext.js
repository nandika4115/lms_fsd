import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const API_URL = "http://localhost:5000";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [isAuthLoading, setIsAuthLoading] = useState(true); // ✨ New state to track initial loading

  // Effect to fetch enrollments when user state changes
  useEffect(() => {
    const fetchEnrollments = async () => {
      const token = localStorage.getItem('token');
      if (user && user.role === 'student' && token) {
        try {
          const response = await axios.get(`${API_URL}/api/enrollments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setEnrolledCourseIds(new Set(response.data));
        } catch (error) {
          console.error("Could not fetch user enrollments:", error);
        }
      } else {
        setEnrolledCourseIds(new Set());
      }
    };
    fetchEnrollments();
  }, [user]);

  // Effect to check for a token on initial app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        if (decodedUser.exp * 1000 > Date.now()) {
          setUser(decodedUser);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setIsAuthLoading(false); // ✨ Finished checking, set loading to false
  }, []);

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

  const value = {
    user,
    isAuthLoading, // ✨ Expose the loading state
    login,
    logout,
    enrolledCourseIds,
    addEnrollment,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

