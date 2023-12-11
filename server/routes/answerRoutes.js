const { authenticateUser } = require('../middleware/helper');
const express = require('express');
const router = express.Router();
const Answer = require('../models/answers');
const Question = require('../models/questions');
const User = require('../models/users');

// GET paginated answers for a specific question
router.get('/question/:qid', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skipIndex = (page - 1) * limit;

        const answers = await Answer.find({ question: req.params.qid })
                                .populate('ans_by', 'username')
                                .sort({ isAccepted: -1, ans_date_time: -1 }) // Accepted answers first, then newest
                                .skip(skipIndex)
                                .limit(limit);

        res.json(answers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// POST a new answer
router.post('/', async (req, res) => {
    try {
        const { questionId, text, ans_by } = req.body;

        // Validate required fields
        if (!questionId || !text || !ans_by) {
            return res.status(400).json({ message: 'Please provide questionId, text, and ans_by for the answer.' });
        }

        const newAnswer = new Answer({
            question: questionId,
            text,
            ans_by,
            ans_date_time: new Date()
        });

        const savedAnswer = await newAnswer.save();

        // Update last_answered_time in the corresponding question
        await Question.findByIdAndUpdate(questionId, { last_answered_time: new Date() });

        res.status(201).json(savedAnswer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.post('/:aid/:voteType', async (req, res) => {
    try {
        const { aid, voteType } = req.params;

        // Check if user is logged in and has enough reputation
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: 'User not logged in' });
        }

        const username = req.session.user.username;
        const user = await User.findOne({ username: username });

        if (!user || user.reputationPoints < 50) {
            return res.status(403).json({ message: 'Insufficient reputation to vote' });
        }

        const updateField = voteType === 'upvote' ? 'upvotes' : 'downvotes';
        const updatedAnswer = await Answer.findOneAndUpdate(
            { aid: aid },
            { $inc: { [updateField]: 1 } },
            { new: true }
        );

        if (!updatedAnswer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        // Update the last_answered_time of the associated question
        await Question.findByIdAndUpdate(updatedAnswer.question, { last_answered_time: new Date() });

        // Update user's reputation based on the vote type
        const reputationChange = voteType === 'upvote' ? 5 : -10;
        await User.findByIdAndUpdate(user._id, { $inc: { reputationPoints: reputationChange } });

        res.status(200).json(updatedAnswer);
    } catch (err) {
        console.error('Error in voting:', err);
        res.status(500).json({ message: err.message });
    }
});



// Route to ACCEPT a specific answer
router.put('/accept/:aid', authenticateUser, async (req, res) => {
    
    
    try {
        const { aid } = req.params;

        // Find the answer
        const answer = await Answer.findOne({ aid: aid });
        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }
        
        console.log(answer);

        // Fetch the associated question using the questionId from the answer
        const question = await Question.findOne({ answers: { $in: [answer._id] } });
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const username = req.session.user.username;
        const user = await User.findOne({ username : username});
        console.log("User found:", user);
        const userId = user._id.toString();


        // console.log("Question:", question);
        // console.log("Session User name:", req.session.user.username);
        // console.log("Question Asked By ID:", question.asked_by.toString());
        // console.log("User sessios ID:", userId);

        // Verify that the current user is the one who asked the question
        if (userId !== question.asked_by.toString()) {
            
            return res.status(403).json({ message: 'Unauthorized: Only the question asker can accept an answer' });
        }

        // Mark the answer as accepted
        answer.isAccepted = true;
        await answer.save();
        
        // Optionally, reset 'isAccepted' for other answers to the same question
        await Answer.updateMany({ question: question._id, _id: { $ne: answer._id } }, { $set: { isAccepted: false } });

        res.json(answer);
    } catch (error) {
        console.error('Error accepting answer:', error);
        res.status(500).json({ message: 'Error accepting answer' });
    }
});



// Route to GET a specific answer by ID for editing
router.get('/:aid', authenticateUser, async (req, res) => {
    console.log("Fetching answer with ID:", req.params.aid);
    console.log("User id: ");
    try {
        // Check if the user is authenticated
        if (!req.session.user || !req.session.user.username) {
            console.log("in here not authenticated");
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const answer = await Answer.findOne({aid:req.params.aid});
        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        res.json(answer);
    } catch (error) {
        console.error('Error fetching answer:', error);
        res.status(500).json({ message: 'Error fetching answer' });
    }
});

// Route to UPDATE a specific answer
router.put('/update/:aid', authenticateUser, async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.username) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find and update the answer
        const updatedAnswer = await Answer.findOneAndUpdate(
            { aid: req.params.aid },
            { text: req.body.text },
            { new: true }
        );

        if (!updatedAnswer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        // Fetch the associated question using the questionId from the updated answer
        const question = await Question.findOne({ answers: { $in: [updatedAnswer._id] } });

        if (!question) {
            console.error('Associated question not found');
            return res.status(404).json({ message: 'Associated question not found' });
        }

        // Update the last_answered_time of the question
        question.last_answered_time = new Date();
        await question.save();

        res.json(updatedAnswer);
    } catch (error) {
        console.error('Error updating answer:', error);
        res.status(500).json({ message: 'Error updating answer' });
    }
});



// Route to DELETE a specific answer
router.delete('/delete/:aid', authenticateUser, async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.username) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find and delete the answer
        const deletedAnswer = await Answer.findOneAndDelete({ aid: req.params.aid });

        if (!deletedAnswer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        // Fetch the associated question using the questionId from the deleted answer
        const question = await Question.findOne({ answers: { $in: [deletedAnswer._id] } });

        if (!question) {
            console.error('Associated question not found');
            return res.status(404).json({ message: 'Associated question not found' });
        }

        // Update the last_answered_time of the question
        question.last_answered_time = new Date();
        await question.save();

        res.json({ message: 'Answer deleted successfully' });
    } catch (error) {
        console.error('Error deleting answer:', error);
        res.status(500).json({ message: 'Error deleting answer' });
    }
});




module.exports = router;
