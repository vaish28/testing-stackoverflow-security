// Importing necessary React hooks and components
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CommentsComponent from './CommentsComponent';
// Importing stylesheet for the page
import '../stylesheets/answerPage.css';

// Component for displaying answers to a specific question
const AnswersPageComponent = () => {
    const { qid } = useParams();
    const navigate = useNavigate();
    const [question, setQuestion] = useState(null);
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // State for managing pagination
    const [currentPage, setCurrentPage] = useState(1);
    const answersPerPage = 5;

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

    useEffect(() => {
        const fetchQuestionData = async () => {
            try {
                // Fetching question data
                const questionResponse = await axios.get(`http://localhost:8000/questions/${qid}`);
                const questionData = questionResponse.data;
    
                setQuestion(questionData);
    
                // Increase view count for the question
                await axios.put(`http://localhost:8000/questions/increaseviewcount/${qid}`);
    
                // Fetching user session data
                const userResponse = await axios.get('http://localhost:8000/api/users/check-session', { withCredentials: true });
                if (userResponse.data.isLoggedIn) {
                    setUser(userResponse.data.user);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Error loading data. Please try again later.');
            }
        };
    
        fetchQuestionData();
    }, [qid]);
    
    
    

    // Helper function to format date and time
    const formatDate = (dateTime) => {
        const date = new Date(dateTime);
        return new Intl.DateTimeFormat('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false
        }).format(date);
    };

    // Function to convert markdown-style hyperlinks in text to HTML anchor tags
    const renderTextWithHyperlinks = (text) => {
        const hyperlinkRegex = /\[([^\]]+)]\((https?:\/\/[^)]+)\)/g;
        let parts = [];
        let match;
        let lastIndex = 0;

        while ((match = hyperlinkRegex.exec(text)) !== null) {
            parts.push(text.substring(lastIndex, match.index));
            parts.push(
                <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer">
                    {match[1]}
                </a>
            );
            lastIndex = match.index + match[0].length;
        }
        parts.push(text.substring(lastIndex));
        return parts;
    };

    // Handling error display
    if (error) {
        return <div className="error-message">{error}</div>;
    }

    // Displaying a loading message while the data is being fetched
    if (!question) {
        return <div>Loading question...</div>;
    }

    

    // Calculate the current answers to display
    const indexOfLastAnswer = currentPage * answersPerPage;
    const indexOfFirstAnswer = indexOfLastAnswer - answersPerPage;
    const currentAnswers = question && question.answers
                            ? question.answers.slice(indexOfFirstAnswer, indexOfLastAnswer)
                            : [];


    const PaginationControls = () => {
    const totalAnswers = question.answers.length;
    const totalPages = Math.ceil(totalAnswers / answersPerPage);
    const isLastPage = currentPage === totalPages || totalAnswers === 0;
    const isFirstPage = currentPage === 1;

    const fetchPaginatedAnswers = async (pageNumber) => {
        setCurrentPage(pageNumber);
        try {
            const answersResponse = await axios.get(`http://localhost:8000/answers/question/${qid}?page=${pageNumber}&limit=${answersPerPage}`);
            setQuestion(prev => ({ ...prev, answers: answersResponse.data }));
        } catch (error) {
            console.error('Error fetching paginated answers:', error);
        }
    };

    return (
        <div className="pagination-controls">
            <button onClick={() => fetchPaginatedAnswers(currentPage - 1)} disabled={isFirstPage}>Prev</button>
            <button onClick={() => fetchPaginatedAnswers(currentPage + 1)} disabled={isLastPage}>Next</button>
        </div>
    );
};

    
    

    const handleVote = async (aid, voteType) => {
        try {
            // Make an API call to handle upvote/downvote
            const response = await axios.post(`http://localhost:8000/answers/${aid}/${voteType}`,null, { withCredentials: true });
            console.log('back');
            updateAnswerVotes(aid, response.data);
            await axios.post(`http://localhost:8000/api/users/${voteType}/${aid}`, null,{ withCredentials: true })
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


    const updateAnswerVotes = (aid, updatedVotes) => {
        setQuestion(prevQuestion => {
            if (!prevQuestion) {
                return null;
            }

            // Update the answer votes in the question state
            const updatedAnswers = prevQuestion.answers.map(answer => {
                if (answer.aid === aid) {
                    return { ...answer, upvotes: updatedVotes.upvotes, downvotes: updatedVotes.downvotes };
                }
                return answer;
            });

            // Update the question state with the updated answers
            return { ...prevQuestion, answers: updatedAnswers };
        });
    };

    const handleAcceptAnswer = async (aid) => {
        try {
            const response = await axios.put(`http://localhost:8000/answers/accept/${aid}`, {}, { withCredentials: true });
            const acceptedAnswer = response.data;

            // Update state to move the accepted answer to the top
            setQuestion(prev => {
                const updatedAnswers = prev.answers.map(a => ({
                    ...a,
                    isAccepted: a.aid === acceptedAnswer.aid
                }));
                updatedAnswers.sort((a, b) => {
                    if (a.isAccepted) return -1;
                    if (b.isAccepted) return 1;
                    return new Date(b.ans_date_time) - new Date(a.ans_date_time);
                });
                return { ...prev, answers: updatedAnswers };
            });
        } catch (error) {
            console.error('Error accepting answer:', error);
        }
    };
    


    // Rendering the component UI
    return (
        <div className="answers-page">
            {question ? (
                <>
                    <div id="answersHeader">
                        <span>{question.views} views </span>
                        <span>{question.answers.length} answers</span>
                        <h2>{question.title}</h2>
                        <button onClick={() => navigate('/ask')} id="askQuestionButton" className="mainDivAskButton" disabled={!isAuthenticated}>Ask a Question</button>
                    </div>
    
                    <div id="questionBody">
                        <div>{renderTextWithHyperlinks(question.text)}</div>
                        <span>{question.views} views</span>
                        <div className="vote-counts">
                            <span>Upvotes: {question.upvotes}</span>
                            <span> Downvotes: {question.downvotes}</span>
                        </div>
                        <div className="questionMetadata">
                            {question.asked_by ? `${question.asked_by.username} asked ${formatDate(question.ask_date_time)}` : 'Unknown user'}
                        </div>
                        <div className="questionTags">
                            {question.tags.map(tag => (
                                <span key={tag.tid} className="tagButton">{tag.name}</span>
                            ))}
                        </div>
                        
                    </div>
    
                    {/* Comments for the Question */}
                    <div className="comments-section">
                        <h4>Comments on Question:</h4>
                        <CommentsComponent parentId={qid} type="question" user={user}/>
                    </div>
    

                    <h3>Answers:</h3>
                    <div className="answers-section">
                        {currentAnswers.length > 0 ? (
                            // Separate the accepted answer from the rest
                            [...currentAnswers].sort((a, b) => {
                                if (a.isAccepted) return -1;
                                if (b.isAccepted) return 1;
                                return new Date(b.ans_date_time) - new Date(a.ans_date_time);
                            }).map(answer => (
                                <div key={answer.aid} className={`answer-container ${answer.isAccepted ? 'accepted-answer' : ''}`}>
                                    {answer.isAccepted && <div className="accepted-answer-header">Accepted Answer</div>}
                                    {question.asked_by._id === user?.id && !answer.isAccepted && (
                                        <button onClick={() => handleAcceptAnswer(answer.aid)}>Accept Answer</button>
                                    )}

                                    <div className="vote-buttons">
                                        {isAuthenticated ? (
                                            <>
                                                <button onClick={() => handleVote(answer.aid, 'upvote')} className='vote'>Upvote {answer.upvotes}</button>
                                                <button onClick={() => handleVote(answer.aid, 'downvote')} className='vote'>Downvote {answer.downvotes}</button>
                                            </>
                                        ) : (
                                            <>
                                                <span>Upvotes: {answer.upvotes}</span>
                                                <span> Downvotes: {answer.downvotes}</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="answerText">{renderTextWithHyperlinks(answer.text)}</div>
                                    <div className="answerAuthor">
                                        {answer.ans_by ? `${answer.ans_by.username} answered ${formatDate(answer.ans_date_time)}` : 'Unknown user'}
                                    </div>

                                    {/* Comments for each Answer */}
                                    <div className="comments-section">
                                        <h4>Comments on Answer:</h4>
                                        <CommentsComponent parentId={answer.aid} type="answer" user={user} />
                                    </div>

                                    <hr style={{ borderTop: "1px dotted #000" }} />
                                </div>
                            ))
                        ) : (
                            <div>No answers yet. Be the first to answer!</div>
                        )}
                    </div>

    
                    {/* Pagination Controls */}
                    <PaginationControls />
                </>
            ) : (
                <div>Loading question...</div>
            )}
    
            {isAuthenticated && (
                <button onClick={() => navigate(`/questions/${qid}/answer`)} className='answers-section-button'>Answer Question</button>
            )}
        </div>
    );
    
};

export default AnswersPageComponent;
