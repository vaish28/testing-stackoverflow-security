// Importing React hooks and additional libraries
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// Importing stylesheet specific to this component
import '../stylesheets/askQuestion.css';

const AskQuestionComponent = () => {
    // State hooks for managing form inputs and errors
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [tags, setTags] = useState("");
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null); // State to store logged-in user info


    // Hook for programmatically navigating between routes
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:8000/api/users/check-session', { withCredentials: true })
            .then(response => {
                console.log("Session check response:", response.data); // Log to check the response
                if (response.data.isLoggedIn) {
                    setUser(response.data.user);
                } else {
                    navigate('/login');
                }
            })
            .catch(() => {
                navigate('/login');
            });
    }, [navigate]);

    // Function to handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }

        const validationErrors = validateInputs(title, text, tags);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            setIsLoading(true);
            try {
                const tagArray = tags.split(/\s+/).filter(tag => tag.trim() !== "");
                const postData = { title, text, tags: tagArray, askedBy: user.id };
                await axios.post('http://localhost:8000/questions', postData);
                navigate('/home');
            } catch (error) {
                if (error.response && error.response.data) {
                    setErrors(prevErrors => ({ ...prevErrors, server: error.response.data.message }));
                } else {
                    console.error('Error posting question:', error);
                }
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Function to validate form inputs
    const validateInputs = (title, text, tags) => {
        let errors = {};

        // Validation for each input field
        if (!title.trim()) errors.title = "Title cannot be empty";
        else if (title.length > 100) errors.title = "Title cannot be more than 100 characters";

        // Validation for text including hyperlink format check
        if (!text.trim()) errors.text = "Question text cannot be empty";
        else {
            const potentialHyperlinkRegex = /\[([^\]]*)]\(([^)]*)\)/g;
            let match;
            while ((match = potentialHyperlinkRegex.exec(text)) !== null) {
                if (match[1] === '' || match[2] === '' || !match[2].startsWith('https://')) {
                    errors.text = "Invalid hyperlink";
                    break;
                }
            }
        }

        // Validation for tags
        if (!tags.trim()) errors.tags = "Tags cannot be empty";
        else {
            const tagArray = tags.split(/\s+/).filter(tag => tag.trim() !== "");
            if (tagArray.length > 5) errors.tags = "Cannot have more than 5 tags";
            else if (tagArray.some(tag => tag.length > 20)) errors.tags = "Tag length cannot be more than 20 characters";
        }
    
        return errors;
    };
    
    // Render function for the form
    return (
        <form onSubmit={handleSubmit} id="questionForm">
            <div>
                <h2 className='question-title'  style={{color:'black'}}>Question Title:</h2>
                <input  
                    type="text" 
                    id="formTitleInput"
                    placeholder="Enter the title of your question"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                {errors.title && <div className="error-message">{errors.title}</div>}
            </div>
            <div>
                <h2 className='question-text' style={{color:'black'}}>Question Text:</h2>
                <textarea  
                    id="formTextInput"
                    placeholder="Describe your question in detail"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                {errors.text && <div className="error-message">{errors.text}</div>}
            </div>
            <div>
                <h2 className='question-tags' style={{color:'black'}}>Tags:</h2>
                <input 
                    type="text" 
                    id="formTagInput"
                    placeholder="Enter up to 5 tags separated by whitespace"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                />
                {errors.tags && <div className="error-message">{errors.tags}</div>}
            </div>
            {errors.server && <div className="error-message">{errors.server}</div>}
            <button type="submit" className="submitQuestionButton" disabled={isLoading}>
                {isLoading ? 'Posting...' : 'Post Question'}
            </button>
        </form>
    );
};

export default AskQuestionComponent;
