// Importing React and necessary hooks
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
// Importing the stylesheet for the home page
import '../stylesheets/homepage.css';

const HomePageComponent = ({ query }) => {
    // State hooks for managing questions data and display
    const [questions, setQuestions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const questionsPerPage = 5;
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [noQuestionsFound, setNoQuestionsFound] = useState(false);
    const [viewType, setViewType] = useState('newest'); // Default view type
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Added state to track authentication
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch user session status on component mount
        axios.get('http://localhost:8000/api/users/check-session', { withCredentials: true })
            .then(response => {
                console.log(response.data.user)
                setIsAuthenticated(response.data.isLoggedIn);
                console.log(response.data.isLoggedIn);
                // console.log(isAuthenticated);

            })
            .catch(error => console.error('Error checking user session:', error));
    }, []);

    // Reset currentPage to 1 when viewType changes
    useEffect(() => {
        console.log("here",isAuthenticated);
        setCurrentPage(1);
    }, [viewType]);
    
    // Effect hook to fetch questions based on query, viewType, or currentPage change
    useEffect(() => {
        const fetchURL = query 
            ? `http://localhost:8000/questions/search?query=${encodeURIComponent(query)}&sort=${viewType}&page=${currentPage}&limit=${questionsPerPage}`
            : `http://localhost:8000/questions/?sort=${viewType}&page=${currentPage}&limit=${questionsPerPage}`;
    
        axios.get(fetchURL)
            .then(response => {
                setQuestions(response.data.questions);
                setTotalQuestions(response.data.totalCount);
                setNoQuestionsFound(response.data.questions.length === 0);
            })
            .catch(error => {
                console.error('Error fetching questions:', error);
                setNoQuestionsFound(true);
                setTotalQuestions(0);
                setError('An error occurred while fetching questions. Please try again.');
            });
    }, [query, viewType, currentPage]);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalQuestions / questionsPerPage);

    // Function to handle pagination
    const handlePagination = (direction) => {
        if (direction === 'next') {
            setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev));
        } else if (direction === 'prev') {
            setCurrentPage(prev => (prev > 1 ? prev - 1 : prev));
        }
    };

    const formatDate = (askDateTime) => {
        const now = new Date();
        const askDate = new Date(askDateTime);
        const diffInSeconds = Math.floor((now - askDate) / 1000);
    
        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    
        const dateOptions = { month: 'short', day: '2-digit', year: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' };
    
        const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(askDate);
        const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(askDate);
    
        // Check if the year is the same
        if (askDate.getFullYear() === now.getFullYear()) {
            return `${formattedDate} at ${formattedTime}`;
        } else {
            // Include year in the format if different
            return `${formattedDate}, at ${formattedTime}`;
        }
    };
    
    


    const handleVote = async (qid, voteType) => {
        if (!isAuthenticated) {
            alert('You must be logged in to vote.');
            return;
        }
    
        try {
            // Make an API call to handle upvote/downvote
            const response = await axios.post(`http://localhost:8000/questions/${qid}/${voteType}`, null, { withCredentials: true });
            console.log(response);
            updateQuestionVotes(qid, response.data);
            console.log('back');
            await axios.post(`http://localhost:8000/api/users/${voteType}/question/${qid}`, null, { withCredentials: true });
        } catch (error) {
            console.error('Error handling vote:', error);
            if (error.response && error.response.status === 403) {
                // Handle insufficient reputation error
                alert('Insufficient reputation to vote.');
            } else {
                alert('Error handling vote. Please try again later.');
            }
        }
    };
    
    const updateQuestionVotes = (qid, updatedVotes) => {
        setQuestions(prevQuestions => {
            return prevQuestions.map(question => {
                if (question.qid === qid) {
                    // Update the question with new vote counts
                    return { ...question, upvotes: updatedVotes.upvotes, downvotes: updatedVotes.downvotes };
                }
                return question;
            });
        });
    };

    const truncateText = (text, maxLength = 100) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
   
// Render function for the home page
return (
    <div className="main-content" id="homeDiv">
        {/* Display error message if there's an error */}
        {error && (
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button className="back" onClick={() => navigate('/')}>Back to Welcome Page</button>
                </div>
            )}
        {/* Section displaying total questions and ask question button */}
        <div className='main-top'>
            <h1>All Questions</h1>
            <p>{totalQuestions} questions</p>
            {/* Conditionally render the button based on isAuthenticated */}
            {isAuthenticated ? (
                    <button onClick={() => navigate('/ask')} className='mainDivAskButton'>Ask a Question</button>
                ) : (
                    <button disabled className='mainDivAskButton'>Ask a Question</button>
                )}
        </div>

        {/* Buttons to change the view type of questions */}
        <div className="buttons-top">
            <div className='button-container'>
                {/* Buttons for Newest, Active, Unanswered view types */}
                <button onClick={() => setViewType('newest')} className={`buttonDeco ${viewType === 'newest' ? 'active' : ''}`}>Newest</button>
                <button onClick={() => setViewType('active')} className={`buttonDeco ${viewType === 'active' ? 'active' : ''}`}>Active</button>
                <button onClick={() => setViewType('unanswered')} className={`buttonDeco ${viewType === 'unanswered' ? 'active' : ''}`}>Unanswered</button>
            </div>
        </div>

        {/* Pagination Controls */}
        <div className="pagination-controls">
            <button onClick={() => handlePagination('prev')} disabled={currentPage === 1}>Prev</button>
            <button onClick={() => handlePagination('next')} disabled={currentPage === totalPages}>Next</button>
        </div>

        {/* Container for displaying questions */}
        <div className="questionContainer">
            {noQuestionsFound ? (
                <p>No questions found.</p>
            ) : (
                questions.map((question) => (
                    <div key={question.qid} className="question-entry">
                        {/* Question statistics like answers count and views */}
                        <div className="postStats">
                            <p>{question.answers.length} answers</p>
                            <p>{question.views || 0} views</p>
                            
                            {/* Vote buttons and counts */}
                            <div className="vote-buttons">
                                {isAuthenticated ? (
                                    <>
                                        <button onClick={() => handleVote(question.qid, 'upvote')}>Upvote {question.upvotes}</button>
                                        <button onClick={() => handleVote(question.qid, 'downvote')}>Downvote {question.downvotes}</button>
                                    </>
                                ) : (
                                    <>
                                        <span>Upvotes: {question.upvotes}</span>
                                        <span> Downvotes: {question.downvotes}</span>
                                    </>
                                )}
                            </div>
                
                        </div>
                        {/* Question title and navigation */}
                        <h2 className="postTitle">
                            <a href="#/" onClick={(e) => {
                                e.preventDefault();
                                navigate(`/questions/${question.qid}`);
                            }}>
                                {question.title}
                            </a>
                        </h2>
                        {/* Display the summary */}
                        <p className="questionSummary">Summary: {truncateText(question.text)}</p>
                        {/* Question metadata like author and ask date */}
                        <div className="lastActivity">
                            <p>{question.asked_by && question.asked_by.username} asked {formatDate(question.ask_date_time)}</p>
                        </div>
                        {/* Displaying tags associated with the question */}
                        <div className="tags">
                            {question.tags.map((tag, index) => (
                                <button key={index} className="tagButton">{tag.name}</button>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

};

//Define prop types
HomePageComponent.propTypes = {
    query: PropTypes.string
};  

export default HomePageComponent;
