// Importing Mongoose and its Schema class for schema definition
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Importing the custom ID schema for generating unique IDs
const idSchema = require("./idSchema");

// Defining the schema for the 'Question' model
const QuestionSchema = new Schema({
    qid: { type: String, unique: true }, // Unique identifier for the question
    title: String, // Title of the question
    text: String, // Text content of the question
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }], // Array of references to Tag documents
    answers: [{ type: Schema.Types.ObjectId, ref: 'Answer' }], // Array of references to Answer documents
    asked_by: { type: Schema.Types.ObjectId, ref: 'User' }, // Link to User model
    comments: [{ type: String, ref: 'Comment' }], // Array of Comment references by custom string ID
    summary: String, // Summary of the question
    answerCount: { type: Number, default: 0 }, // Tracks the number of answers
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    ask_date_time: Date, // Date and time when the question was asked
    views: Number, // Number of views for the question
    last_answered_time: Date, // Date and time of the last answer to the question
});

// Pre-save hook for the Question schema
QuestionSchema.pre('save', async function (next) {
    const doc = this;

    // Check and generate a unique ID (qid) if not already present
    if (!doc.qid) {
        try {
            const idSchemaCounter = await idSchema.findByIdAndUpdate(
                { _id: 'questionId' },
                { $inc: { sequence_value: 1 } }, // Increment the sequence value
                { new: true, upsert: true } // Create a new document if it doesn't exist
            );
            doc.qid = `q${idSchemaCounter.sequence_value}`; // Setting the qid
            next(); // Proceed to save the document
        } catch (err) {
            next(err); // Pass any errors to the next middleware
        }
    } else {
        next(); // If qid already exists, proceed to save the document
    }
});

// Creating the Question model from the schema
const Question = mongoose.model('Question', QuestionSchema);

// Exporting the Question model for use in other parts of the application
module.exports = Question;
