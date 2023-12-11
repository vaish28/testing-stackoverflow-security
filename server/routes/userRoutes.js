const {authenticateUser} = require('../middleware/helper');
const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Question = require('../models/questions');
const Answer = require('../models/answers');
const Tag = require('../models/tags');
const bcrypt = require('bcrypt');

// Function to validate email format
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};


router.get('/', async (req, res) => {
    try {
      const users = await User.find({}, { passwordHash: 0 }); // Exclude passwordHash from the result
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });
  

// User registration route
router.post('/register', async (req, res) => {
    console.log("in here")
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).send("All fields are required");
        }

        if (!validateEmail(email)) {
            return res.status(400).send("Invalid email format");
        }

        if (password.includes(username) || password.includes(email)) {
            return res.status(400).send("Password should not contain username or email");
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).send("User already exists with the same username or email");
        }

        // Hash the password before saving the user
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = new User({ username, email, passwordHash });
        await user.save();

        res.status(201).send("User created successfully");
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send("Error in registration: " + error.message);
    }
});

// User login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Login attempt for user:", username);

        const user = await User.findOne({ username });
        console.log("User found:", user);

        if (!user) {
            console.log("User not found for username:", username);
            return res.status(401).send({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        // console.log("Password match:", isMatch);

        if (isMatch) {
            req.session.user = { id: user._id, username: user.username };
            req.session.save(err => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).send({ message: 'Error during login' });
                }
                return res.send({ message: 'Login successful' });
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send({ message: 'Error during login' });
    }
});

router.get('/check-session', (req, res) => {
    console.log(req.session.user)
    if (req.session && req.session.user) {
        // User is logged in
        res.json({ isLoggedIn: true, user: req.session.user });
    } else {
        // User is not logged in
        res.json({ isLoggedIn: false });
    }
});



// User logout route
router.get('/logout', (req, res) => {
    console.log("Logout route hit");
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).send({ message: 'Error during logout' });
        }
        res.send({ message: 'Logout successful' });
    });
});


// User profile route
router.get('/profile', authenticateUser, async (req, res) => {
    console.log("hitting here")
    console.log(req.session.user.id);
    try {
        if (!req.session && !req.session.user.username) {
            return res.status(401).send({ message: 'Unauthorized' });
        }
        const user = await User.findById(req.session.user.id);
        // console.log(user);

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Return user profile information (excluding sensitive data like passwordHash)
        res.send({
            id: user._id,
            username: user.username,
            email: user.email,
            reputationPoints: user.reputationPoints,
            memberDays: user.memberDays
        });
    } catch (error) {
        console.error('User profile error:', error);
        res.status(500).send({ message: 'Error fetching user profile' });
    }
});


router.get('/questions', authenticateUser, async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.username) {
            return res.status(401).send({ message: 'Unauthorized' });
        }

        // Find user by username
        const user = await User.findOne({ username: req.session.user.username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const page = parseInt(req.query.page) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit) || 5; // Limit of questions per page, default is 5
        const skip = (page - 1) * limit;

        // Use user's _id to filter questions and apply pagination and sorting
        const userQuestions = await Question.find({ asked_by: user._id })
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);

        const totalQuestions = await Question.countDocuments({ asked_by: user._id });

        res.json({
            questions: userQuestions,
            totalQuestions,
            totalPages: Math.ceil(totalQuestions / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching user questions:', error);
        res.status(500).json({ message: 'Error fetching user questions' });
    }
});




router.get('/answers', authenticateUser, async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.username) {
            return res.status(401).send({ message: 'Unauthorized' });
        }

        // Find user by username
        const user = await User.findOne({ username: req.session.user.username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Use user's _id to filter answers
        const userAnswers = await Answer.find({ ans_by: user._id }).populate('question');

        res.json(userAnswers);
    } catch (error) {
        console.error('Error fetching user answers:', error);
        res.status(500).json({ message: 'Error fetching user answers' });
    }
});

router.get('/tags', authenticateUser, async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.username) {
            return res.status(401).send({ message: 'Unauthorized' });
        }

        // Find user by username
        const user = await User.findOne({ username: req.session.user.username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch tags created by the user
        const userTags = await Tag.find({ createdBy: user._id });

        res.json(userTags);
    } catch (error) {
        console.error('Error fetching user tags:', error);
        res.status(500).json({ message: 'Error fetching user tags' });
    }
});



  router.post('/:voteType/:aid', async (req, res) => {
    console.log("in here");
    console.log(req.session.user);

    try {
        console.log("in here");
        if (req.session && req.session.user) {
            console.log("in here inside");
            const username = req.session.user.username;
            console.log(username);
            const voteType = req.params.voteType;
            console.log(voteType);
            const aid = req.params.aid;
            console.log(aid);


            // Retrieve the question and its associated user
            const answer = await Answer.findOne({aid:req.params.aid});
            
            if (!answer) {
                return res.status(404).json({ message: 'Question not found' });
            }

            const ans_by = answer.ans_by;
            console.log(ans_by);

            // Update reputation points based on voteType
            let reputationPointsChange = 0;

            if (voteType === 'upvote') {
                console.log('upvote');
                reputationPointsChange = 5;
            } else if (voteType === 'downvote') {
                console.log('downvote');
                reputationPointsChange = -10;
            }

            const user = await User.findById(ans_by);

            if (!user) {
                // If no user is found with the specified ObjectId
                return res.status(404).json({ message: 'User not found' });
            }
            console.log(user)
            const newUser = await User.findOneAndUpdate(
               { username:user.username},
                { $inc: { reputationPoints: reputationPointsChange } },
                { new: true } // To return the updated user
            );


            console.log("here ");
            res.json({ message: 'Reputation points updated successfully', newUser });
        }
    } catch (error) {
        console.log("in here error");
        console.error('Error updating reputation points:', error);
        res.status(500).json({ message: 'Error updating reputation points' });
    }
});



router.post('/:voteType/question/:qid', async (req, res) => {
    console.log("in here");
    console.log(req.session.user);

    try {
        console.log("in here");
        if (req.session && req.session.user) {
            console.log("in here inside");
            const username = req.session.user.username;
            console.log(username);
            const voteType = req.params.voteType;
            console.log(voteType);
            const qid = req.params.qid;
            console.log(qid);


            // Retrieve the question and its associated user
            const question = await Question.findOne({qid:req.params.qid});
            
            if (!question) {
                return res.status(404).json({ message: 'Question not found' });
            }

            const asked_by = question.asked_by;
            console.log(asked_by);

            // Update reputation points based on voteType
            let reputationPointsChange = 0;

            if (voteType === 'upvote') {
                console.log('upvote');
                reputationPointsChange = 5;
            } else if (voteType === 'downvote') {
                console.log('downvote');
                reputationPointsChange = -10;
            }

            const user = await User.findById(asked_by);

            if (!user) {
                // If no user is found with the specified ObjectId
                return res.status(404).json({ message: 'User not found' });
            }
            console.log(user)
            const newUser = await User.findOneAndUpdate(
               { username:user.username},
                { $inc: { reputationPoints: reputationPointsChange } },
                { new: true } // To return the updated user
            );


            console.log("here ");
            res.json({ message: 'Reputation points updated successfully', newUser });
        }
    } catch (error) {
        console.log("in here error");
        console.error('Error updating reputation points:', error);
        res.status(500).json({ message: 'Error updating reputation points' });
    }
});








router.get('/check-reputation', async (req, res) => {
    try {
        if (req.session && req.session.user) {
            const username = req.session.user.username;

            
            const user = await User.find({username:username});

            if (user && user.reputationPoints >= 50) {
                res.json({ isLoggedIn: true, user: req.session.user, hasEnoughReputation: true });
            } else {
                res.json({ isLoggedIn: true, user: req.session.user, hasEnoughReputation: false });
            }
        } else {
            // User is not logged in
            res.json({ isLoggedIn: false });
        }
    } catch (error) {
        console.error('Error checking reputation points:', error);
        res.status(500).json({ message: 'Error checking reputation points' });
    }
});


module.exports = router;

