const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const http = require('http');
const redis = require('redis');
const randtoken = require('rand-token');
const moment = require('moment');

const client = redis.createClient();
const User = require('../models/user');

const dashboard = 'http://localhost:3000/'

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		res.redirect(dashboard);
	} else {
		return next();
	}
}

router.get('/', ensureAuthenticated, function(req, res){
	res.render('login')
});

// Register
router.get('/register', function(req, res){
	res.render('register');
});

// Login
router.get('/login',ensureAuthenticated, function(req, res){
	res.render('login');
});

// Register User
router.post('/register', function(req, res){
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var address = req.body.address;
	var bloodtype = req.body.bloodtype;
	var birthday = req.body.birthday;
	var cardnumber = req.body.cardnumber;
	var cvs = req.body.cvs;
	var accounttype = req.body.accounttype;

	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('address', 'Address is required').notEmpty();
	req.checkBody('bloodtype', 'Blood type is required').notEmpty();
	req.checkBody('accounttype', 'Account type is required').notEmpty();
	req.checkBody('cardnumber', 'Card Number is required and should have 16 digits').notEmpty().len(16);
	req.checkBody('cvs', 'Card Verification Number is required and should have 3 digits').notEmpty().len(3);
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors){
		res.render('register',{
			errors:errors
		});
	} else {
		var newUser = new User({
			name: name,
			email:email,
			address: address,
			bloodtype: bloodtype,
			accounttype: accounttype,
			cardnumber: cardnumber,
			cvs: cvs,
			username: username,
			password: password

		});

		User.createUser(newUser, function(err, user){
			if(err) throw err;
			console.log(user);
		});

		req.flash('success_msg', 'You are registered and can now login');

		res.redirect('./login');
	}
});

passport.use(new LocalStrategy(
  function(username, password, done) {
   User.getUserByUsername(username, function(err, user){
   	if(err) throw err;
   	if(!user){
   		return done(null, false, {message: 'Unknown User'});
   	}

   	User.comparePassword(password, user.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, user);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local'),
  function(req, res) {
  	assign_token(req.user)
    res.redirect('./');
  });

router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('./login');
});

router.get('/auth', authenticate_token);

function assign_token(user){
	var token = randtoken.generate(32);	
	client.exists(user.id, function(err, reply){
		if(reply==1){
			client.del(user.id);
			var to_remove = client.zscan("tokens_ttl", 0, "MATCH", `${user.id},${user.username}*`)[1][0];
			client.zrem(to_remove);
			client.srem(to_remove.replace(`${user.id},${user.username}`, ''));
		}
		client.zadd(["tokens_ttl", moment(Date.now()).utc().add(2, 'hours').unix(), `${user.id},${user.username},${token}`], function(err, response){

		});
		client.sadd(["tokens", token], function(err, response){

		});
		client.set(token, user.id);
	});
}

function authenticate_token(req, res){
	var token = req.get("token");
	client.sismember("tokens", token, function(err, reply){
		if(reply==1){
			var user_id = client.get(token)
			body = {
				user_id: user_id,
				username: getUserById(user_id).username
			}
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.json(body);
		}
		else{
			res.statusCode = 401;
		}
	});
}

module.exports = router;
