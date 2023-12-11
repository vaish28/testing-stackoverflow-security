import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../stylesheets/welcomePage.css';

const WelcomePageComponent = () => {
    const navigate = useNavigate();

    return (
        <div className="welcome-container">
            <h1 className="welcome-header">Welcome to Fake Stack Overflow</h1>
            <div className="welcome-buttons">
                <button className="welcome-button" onClick={() => navigate('/register')}>Register as New User</button>
                <button className="welcome-button" onClick={() => navigate('/login')}>Login as Existing User</button>
                <button className="welcome-button" onClick={() => navigate('/home')}>Continue as Guest</button>
            </div>
        </div>
    );
};

export default WelcomePageComponent;
