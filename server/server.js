// Application server
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const port = 8000;
const cors = require("cors");
const axios = require('axios');
const DataBaseService = require('./middleware/databaseservice');


const CONNECTION_STRING = 'mongodb://127.0.0.1:27017/fake_so';
const db = new DataBaseService(CONNECTION_STRING);
db.connect();


// MongoDB connection
// mongoose.connect('mongodb://127.0.0.1:27017/fake_so', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });
// const db = mongoose.connection;

// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//     console.log('Connected to MongoDB');
// });
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Session configuration
app.use(session({
    secret: 'my_default_secret_key', // Default secret key
    resave: false,
    saveUninitialized: true,
    // Set secure: true if using https
    cookie: { httpOnly: true, secure: false,
    maxAge: 60*60*1000} // 60  mins
}));

// Use JSON middleware for parsing requests
app.use(express.json());

// Define your models and schema (Question, Answer, Tag) using Mongoose

// Define routes for Questions, Answers, and Tags
const questionRoutes = require('./routes/routes');
const answerRoutes = require('./routes/answerRoutes');
const tagRoutes = require('./routes/tagsRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Connect routes to the application
app.use('/questions', questionRoutes);
app.use('/answers', answerRoutes);
app.use('/tags', tagRoutes);
console.log("Connecting userRoutes");
app.use('/api/users', userRoutes);
app.use('/comments', commentRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
