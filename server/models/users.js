const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true }, // Only store the hashed password
    reputationPoints: { type: Number, default: 0 }, // Adding a reputationPoints field with a default value of 0
    createdAt: { type: Date, default: Date.now } // Adding a createdAt field with a default value of the current date
});

// Adding a virtual field to calculate the number of days the user has been a member
UserSchema.virtual('memberDays').get(function() {
    const currentDate = new Date();
    const creationDate = this.createdAt;
    const timeDifference = currentDate - creationDate;
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    return daysDifference;
});

// Set the toJSON schema option to include virtuals
UserSchema.set('toJSON', { virtuals: true });

const User = mongoose.model('User', UserSchema);

module.exports = User;
