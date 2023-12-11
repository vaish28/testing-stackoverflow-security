import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const CommentsComponent = ({ parentId, type }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalComments, setTotalComments] = useState(0);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const commentsPerPage = 3;

    useEffect(() => {
        fetchComments();
        checkUserSession();
    }, [parentId, currentPage, type]);

    const checkUserSession = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/users/check-session', { withCredentials: true });
            if (response.data.isLoggedIn) {
                setUser(response.data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Error checking user session:', error);
        }
    };

    const fetchComments = async () => {
        try {
            const url = type === 'question' 
                        ? `http://localhost:8000/comments/question/${parentId}?page=${currentPage}&limit=${commentsPerPage}` 
                        : `http://localhost:8000/comments/answer/${parentId}?page=${currentPage}&limit=${commentsPerPage}`;
            const response = await axios.get(url);
            setComments(response.data.comments);
            setTotalComments(response.data.totalCount); // Update total comments
            setError(null);
        } catch (err) {
            setError("Failed to load comments.");
        }
    };

    const totalPages = Math.ceil(totalComments / commentsPerPage);

    const handlePrev = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    const handleNext = () => {
        setCurrentPage(prev => (prev < totalPages) ? prev + 1 : prev);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (newComment.length > 140) {
            setError('Comment exceeds character limit of 140.');
            return;
        }
        if (!user || user.reputationPoints < 50) {
            setError('Insufficient reputation to comment. Need atleast 50.');
            return;
        }
        try {
            console.log(user)
            await axios.post('http://localhost:8000/comments', {
                text: newComment,
                commented_by: user.id,
                onQuestion: type === 'question' ? parentId : null,
                onAnswer: type === 'answer' ? parentId : null
            });
            setNewComment('');
            fetchComments(); // Reload comments
        } catch (err) {
            setError(err.response.data.message || 'Error submitting comment');
        }
    };
    

    const handleUpvote = async (commentId) => {
        try {
            await axios.put(`http://localhost:8000/comments/upvote/${commentId}`);
            fetchComments(); // Reload comments to reflect the upvote
        } catch (err) {
            setError(err.response.data.message || 'Error upvoting comment');
        }
    };
    

    const renderComments = () => {
        if (comments.length === 0) {
            return <p>No comments yet.</p>;
        }
        return comments.map(comment => (
            <div key={comment._id}>
                <p>Comment:  {comment.text}</p>
                <p>Commented by: {comment.commented_by.username}</p>
                <p>Upvotes: {comment.upvotes}</p>
                {user && <button onClick={() => handleUpvote(comment._id)}>Upvote</button>}
            </div>
        ));
    };

    const isNextDisabled = currentPage === totalPages || comments.length === 0;

    return (
        <div>
            {error && <p>{error}</p>}
            {user && (
                <form onSubmit={handleCommentSubmit}>
                    <input 
                        type="text" 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)} 
                        placeholder="Write a comment..."
                    />
                    <button type="submit">Post Comment</button>
                </form>
            )}
            {renderComments()}
            <button onClick={handlePrev} disabled={currentPage === 1}>Prev</button>
            <button onClick={handleNext} disabled={isNextDisabled}>Next</button>
        </div>
    );
};

CommentsComponent.propTypes = {
    parentId: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['question', 'answer']).isRequired,
    user: PropTypes.object
};

export default CommentsComponent;
