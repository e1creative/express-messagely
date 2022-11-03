const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const ExpressError = require('../expressError');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try {
        // get the message
        const message = await Message.get(req.params.id)
        
        // if the logged in username matches the to_username or from_username of the message, return the message
        if (req.user.username === message.from_user.username || req.user.username === message.to_user.username){
            return res.json({message: message})
        }

        // if the usernames don't match, throw an error
        throw new ExpressError('Unauthorized', 401);
    } catch (e) {
        return next(e)
    }  
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        // extraxt our variables
        const from_username = req.user.username
        const { to_username, body } = req.body

        // create a new message
        const newMessage = await Message.create({from_username, to_username, body})

        // return the new message
        return res.json({message: newMessage})
    } catch (e) {
        return next(e)
    }  
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        // get the message first
        const message = await Message.get(req.params.id)

        // if the logged in username matches the to_username, mark the message as read
        if (req.user.username === message.to_user.username){
            const readMessage = await Message.markRead(req.params.id)
            return res.json({message: readMessage})
        }

        // if the logged in username is not the same as the message recipient, throw an error
        throw new ExpressError('Unauthorized', 401);
    } catch (e) {
        return next(e)
    }  
})

module.exports = router;