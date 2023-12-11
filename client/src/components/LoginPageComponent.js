import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../stylesheets/loginPage.css';

export default function LoginPageComponent() {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/users/login', credentials, { withCredentials: true });
            alert('Login successful');
            navigate('/home'); // Redirect to home page on successful login
        } catch (error) {
            alert('Login failed: ' + error.response.data.message);
        }
    };

    // Navigate to the registration page
    const handleRegister = () => {
        navigate('/register');
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    name="username" 
                    value={credentials.username} 
                    onChange={handleChange} 
                    placeholder="Username" 
                    required
                />
                <input 
                    type="password" 
                    name="password" 
                    value={credentials.password}
                    onChange={handleChange} 
                    placeholder="Password" 
                    required
                />
                <button type="submit">Login</button>
            </form>
            <p className="register-text">Don&apos;t have an account? <button onClick={handleRegister}>Register here</button></p>
        </div>
    );
}
