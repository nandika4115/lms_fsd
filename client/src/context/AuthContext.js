import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const API_URL = "http://localhost:5000";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());

  // This effect runs whenever the user logs in or out
  useEffect(() => {
    const fetchEnrollments = async () => {
      const token = localStorage.getItem('token');
      // Only fetch if the user is a logged-in student
      if (user && user.role === 'student' && token) {
        try {
          const response = await axios.get(`${API_URL}/api/enrollments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Store the fetched course IDs in our state
          setEnrolledCourseIds(new Set(response.data));
        } catch (error) {
          console.error("Could not fetch user enrollments:", error);
        }
      } else {
        // Clear the enrollments if the user logs out or is not a student
        setEnrolledCourseIds(new Set());
      }
    };
    fetchEnrollments();
  }, [user]); // The dependency array ensures this runs when the `user` object changes

  // This effect checks for a token on the initial app load
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

  // This function allows a component to instantly update the UI after enrolling
  // without needing to refresh the page.
  const addEnrollment = (courseId) => {
    setEnrolledCourseIds(prevIds => new Set(prevIds).add(courseId));
  };

  const value = {
    user,
    login,
    logout,
    enrolledCourseIds, // Expose the set of enrolled course IDs
    addEnrollment,     // Expose the function to add a new enrollment
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

