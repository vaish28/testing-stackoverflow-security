import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../stylesheets/editAnswer.css';

const EditAnswerComponent = () => {
    const [answer, setAnswer] = useState({ text: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { aid } = useParams();
    const navigate = useNavigate();

    // Authentication check logic
    useEffect(() => {
        axios.get('http://localhost:8000/api/users/check-session', { withCredentials: true })
            .then(response => {
                setIsAuthenticated(response.data.isLoggedIn);
            })
            .catch(error => {
                console.error('Error checking user session:', error);
            });
    }, []);

    useEffect(() => {
        const fetchAnswer = async () => {
            console.log(`Fetching answer from: http://localhost:8000/answers/${aid}`);
            setIsLoading(true);
            try {
                // Update the URL to match the new route in answerRoutes.js
                console.log("in here before get");
                const response = await axios.get(`http://localhost:8000/answers/${aid}`, {withCredentials: true});
                console.log("in here after get");
                setAnswer(response.data);
            } catch (error) {
                console.error('Error fetching answer:', error);
                console.log(`Error details: ${error.message}`);
            }
            setIsLoading(false);
        };
        fetchAnswer();
    }, [aid]);


    const handleUpdate = async (e) => {
        e.preventDefault();
        
        // Check if the user is authenticated
        if (!isAuthenticated) {
            alert('You are not authenticated. Please login or register to edit answers.');
            navigate('/login'); // Redirect to login page
            return;
        }
        
        setIsLoading(true);
        try {
            await axios.put(`http://localhost:8000/answers/update/${aid}`, { text: answer.text }, {withCredentials:true});
            alert('Answer updated successfully');
            navigate('/userprofile/answers');
        } catch (error) {
            console.error('Error updating answer:', error);
        }
        setIsLoading(false);
    };
    
    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this answer?')) {
            // Check if the user is authenticated
            if (!isAuthenticated) {
                alert('You are not authenticated. Please login or register to delete answers.');
                navigate('/login'); // Redirect to login page
                return;
            }
            
            setIsLoading(true);
            try {
                await axios.delete(`http://localhost:8000/answers/delete/${aid}`, {withCredentials:true});
                alert('Answer deleted successfully');
                navigate('/userprofile/answers');
            } catch (error) {
                console.error('Error deleting answer:', error);
            }
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setAnswer({ ...answer, text: e.target.value });
    };

    return (
        <div className="edit-answer-container">
            <button onClick={() => navigate('/userprofile')} className="backButton">Back to Profile</button>
            <h1>Edit Answer</h1>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <form onSubmit={handleUpdate}>
                    <textarea value={answer.text} onChange={handleChange} />
                    <button type="submit" disabled={isLoading}>Update Answer</button>
                    <button type="button" onClick={handleDelete} disabled={isLoading}>Delete Answer</button>
                </form>
            )}
        </div>
    );
    
};

export default EditAnswerComponent;
