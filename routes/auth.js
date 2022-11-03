const express = require('express');
const router = express.Router();
const User = require('../models/user')

const { authenticateJWT, ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const ExpressError = require('../expressError');

const { SECRET_KEY } = require('../config')
const jwt = require('jsonwebtoken')

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
    try {
        const result = await User.authenticate(req.body.username, req.body.password)

        if (!result){
            return next(new ExpressError('User not authenticated!', 400))
        }

        await User.updateLoginTimestamp(req.body.username)

        //return a token
        const token = jwt.sign({username: req.body.username}, SECRET_KEY)
        return res.json({_token: token})
    } catch (e) {
        return next(e)
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
    try {
        // register the user  
        const user = await User.register(req.body)
        const authenticate = await User.authenticate(user.username, user.password)

        if (!authenticate){
            next(new ExpressError('User not authenticated', 400))
        }

        await User.updateLoginTimestamp(user.username)

        //return a token
        const token = jwt.sign({username: req.body.username}, SECRET_KEY)
        return res.json({_token: token})
    } catch (e) {
        if (e.code === '23505'){
            return next(new ExpressError('Username taken, please provide another', 400))
        }
        return next(e);
    }
})

module.exports = router;
