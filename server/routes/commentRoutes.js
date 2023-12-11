const express = require('express');
const router = express.Router();
const Comment = require('../models/comments');
const User = require('../models/users');
const Question = require('../models/questions');
const Answer = require('../models/answers');

// Route to get comments for a question
router.get('/question/:questionId', async (req, res) => {
    const { questionId } = req.params;
    const { page = 1, limit = 3 } = req.query;

    try {
        const comments = await Comment.find({ onQuestion: questionId })
            .populate('commented_by', 'username')
            .sort({ comment_date_time: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const totalCount = await Comment.countDocuments({ onQuestion: questionId });

        res.json({ comments, totalCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Route to get comments for an answer
router.get('/answer/:answerId', async (req, res) => {
    const { answerId } = req.params;
    const { page = 1, limit = 3 } = req.query;

    try {
        const comments = await Comment.find({ onAnswer: answerId })
            .populate('commented_by', 'username')
            .sort({ comment_date_time: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const totalCount = await Comment.countDocuments({ onAnswer: answerId });

        res.json({ comments, totalCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST a new comment
router.post('/', async (req, res) => {
    console.log(req.body);
    try {
        const { text, commented_by, onQuestion, onAnswer } = req.body;
        
        // Validate the incoming data
        if (!text || !commented_by) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (text.length > 140) {
            return res.status(400).json({ message: "Comment exceeds character limit" });
        }

        // Fetch the user's reputation
        const user = await User.findById(commented_by);
        if (!user || user.reputationPoints < 50) {
            return res.status(400).json({ message: "Insufficient reputation to comment" });
        }

        // Create and save the new comment
        const newComment = new Comment({ text, commented_by, onQuestion, onAnswer });
        await newComment.save();

        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route to upvote a comment
router.put('/upvote/:commentId', async (req, res) => {
    try {
      
        console.log(req.params);
        
        const { commentId } = req.params;
       

        // Find the comment and increment its upvotes
        const updatedComment = await Comment.findById(commentId);
       

        if (!updatedComment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        updatedComment.upvotes += 1;
        await updatedComment.save();

        let Id;

        // Check if the comment is on a question or an answer
        if (updatedComment.onQuestion) {
            Id = updatedComment.onQuestion;
        } else if (updatedComment.onAnswer) {
            // Find the answer to get the question ID
            console.log(updatedComment.onAnswer);
            const answer = await Answer.findOne({aid: updatedComment.onAnswer});
           
            if (answer) {
                Id = answer.question;
            }
        }

        if (Id) {
            // Update the last_answered_time of the question
            await Question.findByIdAndUpdate(
                Id,
                { last_answered_time: new Date() },
                { new: true }
            );
        }

        res.json(updatedComment);
    } catch (error) {
        console.error("Error in upvoting comment:", error);
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
