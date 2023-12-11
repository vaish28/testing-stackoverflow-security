const mongoose = require("mongoose");

let object;

class DataBaseService {
    constructor(mongodbConnectionString) {
        if (object) {
            throw new Error("You can only create one instance!");
        }
        this.mongodbConnectionString = mongodbConnectionString;
        object = this;
    }

    connect() {
        mongoose.connect(this.mongodbConnectionString,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
}

module.exports = DataBaseService;