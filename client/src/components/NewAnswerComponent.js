import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import '../stylesheets/answerPage.css';

const NewAnswerComponent = () => {
    const [answerText, setAnswerText] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null);

    const { qid } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:8000/api/users/check-session', { withCredentials: true })
            .then(response => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateAnswerText(answerText);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0 && user) {
            setIsLoading(true);

            try {
                await axios.post(`http://localhost:8000/questions/${qid}/answers`, {
                    text: answerText,
                    username: user.username // Using the user's ID from the session
                });
                navigate(`/questions/${qid}`);
            } catch (error) {
                console.error('Error posting answer:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const validateAnswerText = (text) => {
        let newErrors = {};

        if (!text.trim()) {
            newErrors.answerText = "Answer text cannot be empty";
        } else {
            const potentialHyperlinkRegex = /\[([^\]]*)]\(([^)]*)\)/g;
            let match;
            while ((match = potentialHyperlinkRegex.exec(text)) !== null) {
                if (match[1] === '' || match[2] === '' || !match[2].startsWith('https://')) {
                    newErrors.answerText = "Invalid hyperlink";
                    break;
                }
            }
        }

        return newErrors;
    };

    return (
        <div className="new-answer-page">
            <h5>Provide Your Answer</h5>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="answerTextInput">Answer: <span className="mandatory">*</span></label>
                    <textarea
                        id="answerTextInput"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Your answer here..."
                    />
                    {errors.answerText && <span className="error">{errors.answerText}</span>}
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Posting...' : 'Post Answer'}
                </button>
            </form>
        </div>
    );
};

export default NewAnswerComponent;
