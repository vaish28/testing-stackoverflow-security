const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    text: { type: String, required: true },
    commented_by: { type: Schema.Types.ObjectId, ref: 'User' }, // Reference to the User model
    onQuestion: { type: String, ref: 'Question', default: null }, // Reference to a Question by custom ID
    onAnswer: { type: String, ref: 'Answer', default: null }, // Reference to an Answer by custom ID
    comment_date_time: { type: Date, default: Date.now }, // Date and time of the comment
    upvotes: { type: Number, default: 0 },
    votedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;
