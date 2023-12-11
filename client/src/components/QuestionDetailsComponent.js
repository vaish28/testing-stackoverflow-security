import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../stylesheets/questionDetails.css';

const QuestionDetailsComponent = () => {
  const [question, setQuestion] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const { qid } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestionDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/questions/${qid}`);
        setQuestion(response.data);
        setEditTitle(response.data.title);
        setEditText(response.data.text); 
      } catch (error) {
        console.error('Error fetching question details:', error);
      }
    };

    fetchQuestionDetails();
  }, [qid]);

  const handleRepost = async () => {
    try {
      const response = await axios.post(`http://localhost:8000/questions/${qid}`, {
        newTitle: editTitle, 
        newText: editText
      });
      console.log('Repost response:', response.data);
      alert('Question reposted successfully');
      navigate('/userprofile/questions'); // Navigate back to the questions list
    } catch (error) {
      console.error('Error reposting question:', error.response.data);
      alert(`Error reposting question: ${error.response.data.message}`);
    }
  };
  

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await axios.delete(`http://localhost:8000/questions/${qid}`);
        alert('Question deleted successfully');
        navigate('/userprofile/questions');
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  if (!question) {
    return <p>Loading...</p>;
  }

  return (
    <div className="question-details-container">
        <button onClick={() => navigate('/userprofile')} className="backButton">Back to Profile</button>
        <h1>Edit Question</h1>
        <div>
            <label>Title:</label>
            <input 
                type="text" 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)}
                className="question-input"
            />
        </div>
        <div>
            <label>Text:</label>
            <textarea 
                value={editText} 
                onChange={(e) => setEditText(e.target.value)}
                className="question-textarea"
            />
        </div>
        <button onClick={handleRepost} className="editButton">Repost</button>
        <button onClick={handleDelete} className="deleteButton">Delete</button>
    </div>
);

};

export default QuestionDetailsComponent;
