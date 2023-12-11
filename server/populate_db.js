const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/users'); // Update the path as necessary
const Tag = require('./models/tags');
const Answer = require('./models/answers');
const Question = require('./models/questions');

const mongoDB = process.argv[2];
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


const saltRounds = 10; // Number of salt rounds for bcrypt

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

const createUser = async (name, email, password) => {
  const hashedPassword = await hashPassword(password);
  const user = await userCreate(name, email, hashedPassword);
  return user;
};

async function userCreate(username, email, passwordHash) {
    const user = new User({ username, email, passwordHash });
    return user.save();
}

async function tagCreate(name) {
    const tag = new Tag({ name });
    return tag.save();
}

async function answerCreate(text, ans_by, ans_date_time) {
    const answer = new Answer({ text, ans_by, ans_date_time });
    return answer.save();
}

async function questionCreate(title, text, tags, answers, asked_by, ask_date_time, views) {
    const question = new Question({ title, text, tags, answers, asked_by, ask_date_time, views });
    return question.save();
}

async function populate() {
    // Creating Users
    const user1 = await createUser('Joji John', 'joji@example.com', 'hash1');
    const user2 = await createUser('saltyPeter', 'peter@example.com', 'hash2');
    const user3 = await createUser('hamkalo', 'hamkalo@example.com', 'hash3');
    const user4 = await createUser('azad', 'azad@example.com', 'hash4');
    const user5 = await createUser('alia', 'alia@example.com', 'hash5');
    const user6 = await createUser('sana', 'sana@example.com', 'hash6');
    const user7 = await createUser('abaya', 'abaya@example.com', 'hash7');
    // More users...

    // Creating Tags
    const t1 = await tagCreate('react');
    const t2 = await tagCreate('javascript');
    const t3 = await tagCreate('android-studio');
    const t4 = await tagCreate('shared-preferences');
    // More tags...

    // Creating Answers
    const a1 = await answerCreate('React Router is mostly a wrapper around the history library. history handles interaction with the browser\'s window.history for you with its browser and hash histories. It also provides a memory history which is useful for environments that don\'t have a global history. This is particularly useful in mobile app development (react-native) and unit testing with Node.', user3._id, new Date('2023-11-20T03:24:42'),0,0);
    const a2 = await answerCreate('On my end, I like to have a single history object that I can carry even outside components. I like to have a single history.js file that I import on demand, and just manipulate it. You just have to change BrowserRouter to Router, and specify the history prop. This doesn\'t change anything for you, except that you have your own history object that you can manipulate as you want. You need to install history, the library used by react-router.', user4._id, new Date('2023-11-25T08:24:00'), 0,0);
    const a3 = await answerCreate('Consider using apply() instead; commit writes its data to persistent storage immediately, whereas apply will handle it in the background.', user7._id, new Date('2023-11-18T09:24:00'),0,0);
    const a4 = await answerCreate('YourPreference yourPrefrence = YourPreference.getInstance(context); yourPreference.saveData(YOUR_KEY,YOUR_VALUE);', user5._id, new Date('2023-11-12T03:30:00'),0,0);
    const a5 = await answerCreate('I just found all the above examples just too confusing, so I wrote my own. ', user6._id, new Date('2023-11-01T15:24:19'),0,0);
    // More answers...

    // Creating Questions
    await questionCreate(
        'Programmatically navigate using React router', 'the alert shows the proper index for the li clicked, and when I alert the variable within the last function I\'m calling, moveToNextImage(stepClicked), the same value shows but the animation isn\'t happening. This works many other ways, but I\'m trying to pass the index value of the list item clicked to use for the math to calculate.',  
        [t1._id, t2._id], 
        [a1._id, a2._id], 
        user1._id, 
        new Date('2022-01-20T03:24:00'), 
        100
    );
    await questionCreate(
        'android studio save string shared preference, start activity and load the saved string', 'I am using bottom navigation view but am using custom navigation, so my fragments are not recreated every time i switch to a different view. I just hide/show my fragments depending on the icon selected. The problem i am facing is that whenever a config change happens (dark/light theme), my app crashes. I have 2 fragments in this activity and the below code is what i am using to refrain them from being recreated.', 
        [t3._id, t4._id, t2._id], 
        [a3._id, a4._id, a5._id], 
        user2._id, 
        new Date('2023-10-01T11:24:30'), 
        121
    );
    // More questions...

    db.close();
    console.log('Database populated!');
}

populate().catch(err => {
    console.error('ERROR:', err);
    db.close();
});
