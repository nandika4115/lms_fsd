import React from 'react';
import { Button } from 'react-bootstrap';
import { Sun, Moon } from 'react-bootstrap-icons';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';

const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme();
    const location = useLocation();
    
    // Hide theme toggle on login and signup pages
    const hideOnPages = ['/login', '/register'];
    if (hideOnPages.includes(location.pathname)) {
        return null;
    }

    return (
        <Button
            onClick={toggleTheme}
            className="theme-toggle"
            variant="outline-secondary"
            size="sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
    );
};

export default ThemeToggle;