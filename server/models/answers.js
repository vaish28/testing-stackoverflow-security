const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const idSchema = require('./idSchema');

const AnswerSchema = new Schema({
    aid: { type: String, unique: true },
    question: { type: Schema.Types.ObjectId, ref: 'Question' },
    text: String,
    ans_date_time: Date,
    ans_by: { type: Schema.Types.ObjectId, ref: 'User' },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    upvotes: { type: Number, default: 0 },   
    downvotes: { type: Number, default: 0 },  
    isAccepted: { type: Boolean, default: false }
});

AnswerSchema.pre('save', async function (next) {
    const doc = this;

    if (!doc.aid) {
        try {
            const idSchemaCounter = await idSchema.findByIdAndUpdate(
                { _id: 'answerId' },
                { $inc: { sequence_value: 1 } },
                { new: true, upsert: true }
            );
            doc.aid = `a${idSchemaCounter.sequence_value}`;
        } catch (err) {
            next(err);
        }
    }

    if (this.isNew || this.isModified('text')) {
        try {
            await mongoose.model('Question').findByIdAndUpdate(
                doc.question,
                { last_answered_time: new Date() }
            );
        } catch (err) {
            next(err);
        }
    }

    next();
});

// Custom method to handle upvoting
AnswerSchema.methods.upvote = async function () {
    this.upvotes += 1;
    await this.save();
};

// Custom method to handle downvoting
AnswerSchema.methods.downvote = async function () {
    this.downvotes += 1;
    await this.save();
};

const Answer = mongoose.model('Answer', AnswerSchema);

module.exports = Answer;
