const express = require('express');
const router = express.Router();
const User = require('../models/users');
const bcrypt = require('bcrypt');

const authenticateUser = (req, res, next) => {
    console.log(req.session.user);
    console.log("hitting here n middeS")
    if (!req.session.user && !req.session.user) {
        return res.status(401).send({ message: 'Unauthorized' });
    }
    next();
};

module.exports = {authenticateUser};