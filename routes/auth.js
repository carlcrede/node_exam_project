const router = require('express').Router();

const pages = require('../util/ssr');

const { body, validationResult } = require('express-validator');

const User = require('../db/model/user.js');

const bcrypt = require('bcrypt');
const saltRounds = process.env.BCRYPT_SALTROUNDS;

router.get('/register', (req, res) => {
    res.send(pages.register);
});

router.post('/register', async (req, res) => {
    try {
        const username = req.body.username;
        const plainTextPassword = req.body.password;
        const hashedPwd = await bcrypt.hash(plainTextPassword, saltRounds);
        const insertResult = await User.create({
            user: username,
            pass: hashedPwd
        });
        res.send({insertResult});
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error occured");
    }
});

router.get('/login', (req, res) => {
    if(req.session.userId){
        res.redirect('/');
    } else {
        res.send(pages.login);
    }
});

router.post('/login', 
    body('username').escape(),
    body('password').escape(),
    async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findOne({ user: req.body.username });
        if (user) {
            const cmp = await bcrypt.compare(req.body.password, user.pass);
            if (cmp) {
                // further code to maintain authentication like jwt or sessions
                req.session.userId = req.body.username;
                res.redirect('/');
            } else {
                res.send("Wrong username or password.");
            } 
        } else {
            res.send("Wrong username or password.");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error occured");
    }
});

router.post('/logout', (req, res) => {
    if(!req.session.userId){
        res.redirect('/');
    } else {
        req.session.destroy(() => {
            res.clearCookie('sid');
            res.redirect('/');
        });
    }
});

module.exports = {
    router
}