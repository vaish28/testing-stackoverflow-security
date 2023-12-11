const { authenticateUser } = require('../middleware/helper');
const express = require('express');
const router = express.Router();
const Tag = require('../models/tags');
const Question = require('../models/questions');
const User = require('../models/users')

// Route to GET all tags along with their associated question counts
router.get('/', async (req, res) => {
    try {
        const tags = await Tag.find();
        const tagsWithQuestionCounts = await Promise.all(tags.map(async (tag) => {
            const questionCount = await Question.countDocuments({ tags: tag._id });
            return {
                ...tag.toObject(),
                questionCount
            };
        }));
        res.json(tagsWithQuestionCounts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Route to GET all questions associated with a specific tag
router.get('/:tagId/questions', async (req, res) => {
    try {
        const tagId = req.params.tagId;
        const tag = await Tag.findOne({ tid: tagId });
        if (!tag) {
            return res.status(404).json({ message: 'Tag not found' });
        }
        const questions = await Question.find({ tags: tag._id })
            .populate('tags')
            .populate('asked_by', 'username') 
            .populate('answers')
            .sort({ ask_date_time: -1 }) // Sorting questions by newest first
            .exec();

        res.json({ tag: tag, questions: questions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Route to POST a new tag
router.post('/', async (req, res) => {
    const { name, userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user || user.reputationPoints < 50) {
            return res.status(403).json({ message: 'Insufficient reputation to add new tags' });
        }

        const newTag = new Tag({ name, createdBy: user._id });
        await newTag.save();
        res.status(201).json(newTag);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Edit a user's tag
router.put('/edit/:tagId', authenticateUser, async (req, res) => {
    console.log('Tag ID:', req.params.tagId);
    console.log('New Name:', req.body.newName);
    try {
        const { tagId: tid } = req.params;
        const { newName } = req.body;

        // Validation
        if (!newName.trim()) {
            return res.status(400).json({ message: 'Tag name cannot be empty' });
        }
        if (newName.length > 20) {
            return res.status(400).json({ message: 'New tag length cannot be more than 20' });
        }

        const tag = await Tag.findOne({ tid, createdBy: req.session.user.id });
        console.log('Found tag:', tag);

        if (!tag) {
            return res.status(404).json({ message: 'Tag not found or not owned by user' });
        }

        // Check if the tag is used by other users' questions
        const questionsUsingTag = await Question.find({ tags: tag._id, asked_by: { $ne: req.session.user.id } });
        if (questionsUsingTag.length > 0) {
            return res.status(403).json({ message: 'Cannot edit a tag used by other users' });
        }

        tag.name = newName;
        await tag.save();

        res.json({ message: 'Tag updated successfully', tag });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a user's tag
router.delete('/:tagId', authenticateUser, async (req, res) => {
    console.log('Attempting to delete tag with ID:', req.params.tagId);
    console.log('User ID', req.session.user.id);
    try {
        const { tagId: tid } = req.params;

        const tag = await Tag.findOneAndDelete({ tid, createdBy: req.session.user.id });
        console.log('Found tag:', tag);

        if (!tag) {
            return res.status(404).json({ message: 'Tag not found or not owned by user' });
        }

        // Check if the tag is used by other users' questions
        const questionsUsingTag = await Question.find({ tags: tag._id, asked_by: { $ne: req.session.user.id } });
        if (questionsUsingTag.length > 0) {
            return res.status(403).json({ message: 'Cannot delete a tag used by other users' });
        }

        // Remove the tag from all associated questions
        await Question.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } });

        res.json({ message: 'Tag deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



module.exports = router;
