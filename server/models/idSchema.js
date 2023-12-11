// Importing Mongoose and its Schema class
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Creating a new schema for ID counters
const idSchema = new Schema({
  // The identifier for the type of entity (like 'questionId', 'answerId', etc.)
  _id: {
    type: String,
    required: true, // Ensures that this field is mandatory
  },
  // The value of the counter used for generating unique IDs
  sequence_value: {
    type: Number,
    default: 0, // Starts from 0 by default
  }
});

// Creating a Mongoose model from the idSchema
const id = mongoose.model('Counter', idSchema);

// Exporting the model for use in other parts of the application
module.exports = id;
