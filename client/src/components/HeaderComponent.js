// Importing React and necessary hooks
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileLogo from './ProfileLogo';

// Importing stylesheet for the header component
import '../stylesheets/header.css';

const HeaderComponent = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();
    const [error, setError] = useState(false);

    // Handler for search functionality
    const handleSearch = (e) => {
        // Triggering search on 'Enter' key press
        if (e.key === 'Enter') {
            // Logging the search term for debugging
            console.log('Search:', e.target.value);
            // Navigating to the search results page with the search query
            navigate(`/search?query=${e.target.value}`);
        }
    };

    // Handler for navigating back to the welcome page
    const handleBackToWelcome = () => {
        setError(false); // Reset error state
        navigate('/'); // Navigate to welcome page
    };

    // Check user session status on component mount
    useEffect(() => {
        axios.get('http://localhost:8000/api/users/check-session', { withCredentials: true })
            .then(response => {
                setIsAuthenticated(response.data.isLoggedIn);
            })
            .catch(error => {
                console.error('Error checking user session:', error);
                setError('An error occurred. Please try again.');
            });
    }, []);

    const handleLogout = async () => {
        try {
            await axios.get('http://localhost:8000/api/users/logout', { withCredentials: true });
            navigate('/'); // Redirect to the welcome page after logout
        } catch (error) {
            console.error('Logout failed:', error);
            setError('Failed to log out. Please try again.');
        }
    };

    // Render function for the header component
    return (
        <div className="header">
            <h1 id="titleApplication">Fake Stack Overflow</h1>

            <input 
                className="searchBar"
                type="text" 
                id="searchBar" 
                placeholder="Search..." 
                onKeyDown={handleSearch}
                style={{ marginLeft: '250px', width: '230px', lineHeight: '1px', height: '25px' }}
            />

            <ProfileLogo />

            {/* Display error message and back button if there's an error */}
            {error && (
                <div>
                    <p className="error-message">{error}</p>
                    <button className="back" onClick={handleBackToWelcome}>Back to Welcome Page</button>
                </div>
            )}
            <button onClick={() => navigate('/')}>Back to Welcome Page</button>

            {/* Conditional rendering based on isAuthenticated state */}
            {isAuthenticated ? (
                <button onClick={handleLogout}>Logout</button>
            ) : (
                <>
                    <button onClick={() => navigate('/register')}>Register</button>
                    <button onClick={() => navigate('/login')}>Login</button>
                </>
            )}
        </div>
    );
};

export default HeaderComponent;
