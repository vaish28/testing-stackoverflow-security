const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const idSchema = require("./idSchema");

const TagSchema = new Schema({
    tid: { type: String, unique: true },
    name: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

TagSchema.pre('save', async function (next) {
    if (!this.tid) {
        const idCounter = await idSchema.findByIdAndUpdate(
            { _id: 'tagId' },
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true }
        );
        this.tid = `t${idCounter.sequence_value}`;
    }
    next();
});

const Tag = mongoose.model('Tag', TagSchema);
module.exports = Tag;
