const express = require('express');
const router = express.Router();
const Question = require('../models/questions');
const Tag = require('../models/tags');
const Answer = require('../models/answers');
const User = require('../models/users')
const Comment = require('../models/comments');


router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const sortOption = req.query.sort || 'newest';

    let sortCriteria;
    let filterCriteria = {};
    switch (sortOption) {
        case 'newest':
            sortCriteria = { ask_date_time: -1 };
            break;
        case 'active':
            sortCriteria = { last_answered_time: -1 };
            break;
        case 'unanswered':
            sortCriteria = { ask_date_time: -1 };
            filterCriteria = { answers: { $size: 0 } }; // Filter for questions with no answers
            break;
        default:
            sortCriteria = { ask_date_time: -1 };
    }

    try {
        // Count the documents based on the filter criteria for accurate pagination
        const totalQuestions = await Question.countDocuments(filterCriteria);

        // Fetch the questions based on the page, limit, and filter criteria
        const questions = await Question.find(filterCriteria)
            .populate('tags')
            .populate('asked_by', 'username')
            .populate('answers')
            .sort(sortCriteria)
            .limit(limit)
            .skip((page - 1) * limit);

        res.json({
            questions,
            totalCount: totalQuestions // Send back the total count for accurate pagination on the frontend
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Enhanced search functionality
router.get('/search', async (req, res) => {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const sortOption = req.query.sort || 'newest';

    if (!query) {
        return res.status(400).json({ message: "No search query provided" });
    }

    let sortCriteria;
    let filterCriteria = {};
    switch (sortOption) {
        case 'newest':
            sortCriteria = { ask_date_time: -1 };
            break;
        case 'active':
            sortCriteria = { last_answered_time: -1 };
            break;
        case 'unanswered':
            sortCriteria = { ask_date_time: -1 };
            filterCriteria = { answers: { $size: 0 } };
            break;
        default:
            sortCriteria = { ask_date_time: -1 };
    }

    try {
        // Extract complete tags from the query
        const tagMatches = query.match(/\[([^\]]+)\]/g) || [];
        const tagsToSearch = tagMatches.map(match => new RegExp('^' + match.slice(1, -1).trim() + '$', 'i'));

        // Removing tag syntax from query for text search
        const nonTagQuery = query.replace(/\[([^\]]+)\]/g, '').trim();

        // Build query conditions
        const queryConditions = [];
        if (nonTagQuery) {
            const regex = new RegExp(nonTagQuery, 'i');
            queryConditions.push({ title: { $regex: regex } }, { text: { $regex: regex } });
        }

        if (tagsToSearch.length > 0) {
            const tagIds = (await Tag.find({ name: { $in: tagsToSearch } })).map(tag => tag._id);
            if (tagIds.length > 0) {
                queryConditions.push({ tags: { $in: tagIds } });
            }
        }

        if (queryConditions.length === 0) {
            return res.status(404).json({ message: 'No questions found' });
        }

        // Combine search conditions with filter criteria
        let searchConditions = queryConditions.length > 0 ? { $or: queryConditions } : {};
        if (Object.keys(filterCriteria).length > 0) {
            searchConditions = { ...searchConditions, ...filterCriteria };
        }

        const totalQuestions = await Question.countDocuments(searchConditions);

        const questions = await Question.find(searchConditions)
            .populate('tags')
            .populate('answers')
            .populate('asked_by', 'username')
            .sort(sortCriteria)
            .limit(limit)
            .skip((page - 1) * limit);

        res.json({
            questions: questions,
            totalCount: totalQuestions
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a specific question by qid
router.get("/:qid", async (req, res) => {
    try {
        const question = await Question.findOne({ qid: req.params.qid })
            .populate('tags')
            .populate('asked_by', 'username') 
            .populate({ 
                path: 'answers',
                populate: {
                    path: 'ans_by',
                    select: 'username'
                }
            });
        
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.json(question);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Increment view count
router.put("/increaseviewcount/:qid", async (req, res) => {
    console.log("Increasing view")
    try {
        const update = await Question.findOneAndUpdate({ qid: req.params.qid }, {$inc: { views: 1 }}, { new: true });
        res.json(update);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new question
router.post('/', async (req, res) => {
    try {
        const { title, text, tags, askedBy } = req.body;

        // Find the user who is posting the question
        const user = await User.findById(askedBy);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Handle tag processing
        const processedTags = await Promise.all(tags.map(async tagName => {
            let tag = await Tag.findOne({ name: tagName.toLowerCase() });

            if (!tag) {
                if (user.reputationPoints < 50) {
                    throw new Error('Insufficient reputation to add new tags');
                }
                // Create a new tag
                tag = new Tag({ name: tagName.toLowerCase(), createdBy: askedBy });
                await tag.save();
            }

            return tag._id;
        }));

        // Create a new question
        const newQuestion = new Question({
            title, 
            text, 
            tags: processedTags, 
            asked_by: askedBy, 
            ask_date_time: new Date(),
            views: 0
        });

        await newQuestion.save();
        res.status(201).json(newQuestion);

    } catch (err) {
        console.error('Error posting new question:', err);
        res.status(500).json({ message: err.message || 'Internal Server Error' });
    }
});

module.exports = router;


// POST a new answer to a specific question
router.post('/:qid/answers', async (req, res) => {
    const { qid } = req.params;
    const { text, username } = req.body;

    try {
        // Find the user object based on the provided username
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const foundQuestion = await Question.findOne({ qid: qid });

        if (foundQuestion) {
            const newAnswer = new Answer({ 
                text: text,
                ans_by: user, // Use the user object here
                ans_date_time: new Date()
            });

            await newAnswer.save();

            await Question.findByIdAndUpdate(
                foundQuestion._id,
                { $push: { answers: newAnswer._id }, $set: { last_answered_time: new Date() } }
            );

            res.status(201).json(newAnswer);
        } else {
            res.status(404).json({ message: "Question not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/:qid/:voteType', async (req, res) => {
    try {
        const { qid, voteType } = req.params;

        // Check if user is logged in and has enough reputation
        if (req.session && req.session.user) {
            const username = req.session.user.username;
            const user = await User.findOne({ username: username });

            if (!user || user.reputationPoints < 50) {
                return res.status(403).json({ message: 'Insufficient reputation to vote' });
            }

            const updateField = voteType === 'upvote' ? 'upvotes' : 'downvotes';

            // Find the question and update its vote count
            const updatedQuestion = await Question.findOneAndUpdate(
                { qid: qid },
                { 
                    $inc: { [updateField]: 1 },
                    $set: { last_answered_time: new Date() }
                },
                { new: true }
            );

            if (!updatedQuestion) {
                return res.status(404).json({ message: 'Question not found' });
            }

            res.status(200).json(updatedQuestion);    
        } else {
            return res.status(401).json({ message: 'User not logged in' });
        }
    } catch (error) {
        console.error('Error in voting on question:', error);
        res.status(500).json({ message: error.message });
    }
});



//Route for user to repost question- makes active
router.post('/:questionId', async (req, res) => {
    const { questionId } = req.params;

    try {
        const originalQuestion = await Question.findOne({ qid: questionId });
        console.log('Fetched question:', originalQuestion);

        if (!originalQuestion) {
            return res.status(404).json({ message: 'Question not found' });
        }
        const { newTitle, newText } = req.body;
        // Use existing upvotes and downvotes from originalQuestion
        const upvotes = originalQuestion.upvotes;
        const downvotes = originalQuestion.downvotes;
        // Update the question
        const updatedQuestion = await Question.findByIdAndUpdate(
            originalQuestion._id, 
            {
                $set: {
                    title: newTitle || originalQuestion.title,
                    text: newText || originalQuestion.text,
                    tags: originalQuestion.tags,
                    answers: originalQuestion.answers,
                    comments: originalQuestion.comments,
                    upvotes: upvotes,
                    downvotes: downvotes,
                    asked_by: originalQuestion.asked_by,
                    views: originalQuestion.views,
                    ask_date_time: originalQuestion.ask_date_time,
                    last_answered_time: new Date(),
                },
            },
            { new: true }
        );

        console.log('Updated question:', updatedQuestion);

        res.json({ message: 'Question reposted successfully', updatedQuestion });
    } catch (error) {
        console.error('Error reposting question:', error);
        res.status(500).json({ message: `Error reposting question: ${error.message}` });
    }
});



  // Delete a question and its associated answers and comments
  router.delete('/:questionId', async (req, res) => {
    const { questionId } = req.params;

    try {
        // Find the question
        const question = await Question.findOne({ qid: questionId });
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Delete all answers associated with the question
        const answers = await Answer.find({ question: question._id });
        const answerIds = answers.map(answer => answer._id);
        await Answer.deleteMany({ question: question._id });

        // Delete comments associated with the question and its answers
        await Comment.deleteMany({ $or: [{ onQuestion: question.qid }, { onAnswer: { $in: answerIds } }] });

        // Finally, delete the question
        await Question.deleteOne({ _id: question._id });

        res.status(200).json({ message: 'Question and associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ message: 'Error deleting question' });
    }
});

  

module.exports = router;
