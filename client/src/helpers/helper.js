// Importing axios for HTTP requests
import axios from 'axios';

// Function to increment the view count of a question
export const incrementViewCountQuestion = async (qid) => {
    const res = await axios.put(`http://localhost:8000/questions/increaseviewcount/${qid}`);
    return res.data; // Returning the response data
}

// Function to find a question by its ID (qid)
export const findQuestionByQid = async(qid) => {
    console.log(qid); // Logging for debugging purposes
    const res = await axios.get(`http://localhost:8000/questions/${qid}`);
    return res.data; // Returning the fetched question data
}

// Function to add a new tag (currently no arguments are passed)
export const addTag = async() => {
    const res = await axios.post(`http://localhost:8000/tags/addtag/`);
    return res.data; // Returning the response data
}

// Function to add a new answer (currently no arguments are passed)
export const addAnswer = async() => {
    const res = await axios.post(`http://localhost:8000/tags/addanswer/`);
    return res.data; // Returning the response data
}

// Function to fetch all tags
export const fetchTags = async () => {
    try {
        const response = await axios.get(`http://localhost:8000/tags`);
        return response.data; // Returning the fetched tags data
    } catch (error) {
        console.error('Error fetching tags:', error); // Logging errors
        throw error; // Rethrowing the error for handling by the caller
    }
};

// Function to fetch questions by a specific tag ID
export const fetchQuestionsByTag = async (tagId) => {
    try {
        const response = await axios.get(`http://localhost:8000/tags/${tagId}/questions`);
        return response.data; // Returning the fetched questions data
    } catch (error) {
        console.error('Error fetching questions for tag:', error); // Logging errors
        throw error; // Rethrowing the error for handling by the caller
    }
};


