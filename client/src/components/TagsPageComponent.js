// Importing React and necessary hooks
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Importing a helper function to fetch tags
import { fetchTags } from "../helpers/helper.js";

// Importing the stylesheet for the tags page
import '../stylesheets/tagsPage.css';

export default function TagsPageComponent() {
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false); // State to track authentication
    const navigate = useNavigate();

    // Check if the user is authenticated
    useEffect(() => {
        axios.get('http://localhost:8000/api/users/check-session', { withCredentials: true })
            .then(response => {
                setIsAuthenticated(response.data.isLoggedIn);
            })
            .catch(error => console.error('Error checking user session:', error));
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchTags()
            .then(data => setTags(data))
            .catch(err => setError(err.message || 'Error loading tags'))
            .finally(() => setIsLoading(false));
    }, []);
    
    const handleAskQuestionClick = () => {
        navigate('/ask');
    };

    if (isLoading) return <p>Loading...</p>;
    if (error) {
        return (
            <div>
                <p className="error-message">{error}</p>
                <button className="back" onClick={() => navigate('/')}>Back to Welcome Page</button>
            </div>
        );
    }

    return (
        <div>
            <div id="tagsHeader">
                <span>{tags.length} Tags</span>
                <h3>All Tags</h3>
                {isAuthenticated ? (
                    <button onClick={handleAskQuestionClick} className="askQuestionButton">Ask a Question</button>
                ) : (
                    <button disabled className="askQuestionButton">Ask a Question</button>
                )}
            </div>
            <div className="tagsContainer">
                {tags.map(tag => (
                    <div className="tagNode" key={tag.tid} onClick={() => navigate(`/tags/${tag.tid}`)}>
                        <span>{tag.name} ({tag.questionCount} questions)</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
