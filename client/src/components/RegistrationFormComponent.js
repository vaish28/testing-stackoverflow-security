import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../stylesheets/registrationPage.css';


export default function RegistrationFormComponent() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const navigate = useNavigate();

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side Validation
        if (!validateEmail(formData.email)) {
            alert('Please enter a valid email address');
            return;
        }

        if (formData.password.includes(formData.username) || formData.password.includes(formData.email)) {
            alert('Password should not contain username or email');
            return;
        }

        // Additional validation for password confirmation
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            await axios.post('http://localhost:8000/api/users/register', formData);
            alert('User registered successfully');
            navigate('/login'); // Redirect to login page after successful registration
        } catch (error) {
            alert('Registration failed: ' + error.response.data);
        }
    };

    return (
        <div className='registration-container'>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    placeholder="Username" 
                    required
                />
                <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="Email" 
                    required
                />
                <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="Password" 
                    required
                />
                <input 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    placeholder="Confirm Password" 
                    required
                />
                <button type="submit">Register</button>
            </form>
        </div>
    );
}
