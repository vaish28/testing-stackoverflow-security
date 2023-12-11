import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../stylesheets/userQuestions.css';

const QuestionsComponent = () => {
    const [questions, setQuestions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const navigate = useNavigate();

    const fetchQuestions = async (page = 1) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/users/questions?page=${page}`, { withCredentials: true });
            if (response.data) {
                setQuestions(response.data.questions);
                setTotalPages(response.data.totalPages);
                setCurrentPage(response.data.currentPage);
            } else {
                setQuestions([]);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            setQuestions([]);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handlePagination = (direction) => {
        const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
        fetchQuestions(newPage);
    };

    if (questions.length === 0) {
        return (
            <div>
                <button onClick={() => navigate('/userprofile')} className="backButton">Back to Profile</button>
                <h2>Your Asked Questions:</h2>
                <p>No questions asked yet!</p>
            </div>
        );
    }

    return (
        <div className="questions-container">
            <button onClick={() => navigate('/userprofile')} className="backButton">Back to Profile</button>
            <h1>Your Asked Questions:</h1>
            <ul className="questions-list">
                {questions.map(question => (
                    <li key={question._id}>
                        <Link to={`/questions/details/${question.qid}`}>{question.title}</Link>
                    </li>
                ))}
            </ul>
            <div className="pagination-controls">
                <button onClick={() => handlePagination('prev')} disabled={currentPage <= 1}>Prev</button>
                <button onClick={() => handlePagination('next')} disabled={currentPage >= totalPages}>Next</button>
            </div>
        </div>
    );
};

export default QuestionsComponent;
