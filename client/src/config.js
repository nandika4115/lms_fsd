// Determine API URL based on environment
const getAPIUrl = () => {
    // Use environment variable if set (for production/custom deployments)
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    // For development: use the same host as the frontend (allows mobile access)
    // If frontend is accessed via IP address, backend should be on same IP
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }

    // For mobile/network access: construct URL using frontend's hostname
    return `http://${window.location.hostname}:5000`;
};

const API_URL = getAPIUrl();
export default API_URL;
