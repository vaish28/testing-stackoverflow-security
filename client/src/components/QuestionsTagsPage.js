// Importing necessary React hooks and libraries
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Importing stylesheets for the page
import '../stylesheets/tagsPage.css';
import '../stylesheets/questionTagsPage.css';

export default function QuestionTagsPage() {
    // Getting the tag ID from URL parameters
    const { tid } = useParams();
    // State hooks for managing tag data, questions, loading state, and errors
    const [tag, setTag] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Hook for programmatic navigation
    const navigate = useNavigate();

    // Effect hook to fetch questions associated with a specific tag
    useEffect(() => {
        const fetchQuestionsForTag = async () => {
            try {
                // Fetching data for the specified tag
                const response = await axios.get(`http://localhost:8000/tags/${tid}/questions`);
                setTag(response.data.tag);
                setQuestions(response.data.questions);
            } catch (err) {
                // Handling errors and updating the error state
                setError(err.response ? err.response.data.message : err.message);
                setError("Error loading questions");
            } finally {
                // Setting the loading state to false after data fetch or error
                setIsLoading(false);
            }
        };

        fetchQuestionsForTag();
    }, [tid]);

    // Function to format the date and time for display
    const formatDate = (askDateTime) => {
        const now = new Date();
        const askDate = new Date(askDateTime);
        const diffInSeconds = Math.floor((now - askDate) / 1000);
    
        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    
        return new Intl.DateTimeFormat('en-US', { 
            month: 'short', 
            day: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false, 
            hourCycle: 'h23' 
        }).format(askDate).replace(/,/g, '');
    };

    // Function to handle question click, navigating to the question's detail page
    const handleQuestionClick = (questionId) => {
        navigate(`/questions/${questionId}`);
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

    // Render function for the questions tagged with a specific tag
    return (
        <div>
            {/* Displaying the tag name */}
            <h3>Questions tagged with: {tag ? tag.name : 'Loading...'}</h3>
            <div className="questionsList">
                {/* Iterating through the questions list */}
                {questions.length > 0 ? questions.map(question => (
                    <article key={question.qid} className="question-entry" onClick={() => handleQuestionClick(question.qid)}>
                        {/* Question title and summary */}
                        <header>
                            <h4 className="postTitle">{question.title}</h4>
                        </header>
                        <p>{question.text}</p>
                        {/* Question metadata */}
                        <footer>
                            <span>Asked by: {question.asked_by && question.asked_by.username}</span>
                            <span> | {question.answers.length} answers</span>
                            <span> | {question.views} views</span>
                            <span> | Asked: {formatDate(question.ask_date_time)}</span>
                        </footer>
                    </article>
                )) : <p>No questions found for this tag.</p>}
            </div>
        </div>
    );
}
