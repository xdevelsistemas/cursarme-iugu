'use strict';
// load all the things we need
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
// load up the perms model
const permLogin = require('./permLogin');
const passportGoogle = require('./passport-google');
const _ = require('lodash');
const tokens = require('./tokens');
const Bearer = require('passport-http-bearer').Strategy;

// expose this function to our app using module.exports
module.exports = function (passport) {

    // passport session setup ==================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session



    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    // used to deserialize the user
    passport.deserializeUser(function(obj, done) {
        done(null,  obj);
    });



    //TOKEN
    //passport
    passport.use(new Bearer(
        (token, cb) => {
            if (tokens.main.filter(d=>d == token).length > 0) {
                return cb(null, {user: "root"});
            } else {
                return cb(null, false);
            }
        })
    );

    // GOOGLE ==================================================================
    passport.use(new GoogleStrategy(passportGoogle,
        function (accessToken, refreshToken, profile, done) {
            // make the code asynchronous
            // User.findOne won't fire until we have all our data back from Google
            process.nextTick(function () {
                //validando por regras de permissoes
                if (_.indexOf(permLogin.emails,profile.emails[0].value) >= 0 ){
                    let User = {};
                    User.google = {};
                    var picture = profile._json['image'].url;
                    // set all of the relevant information
                    User.google.id = profile.id;
                    User.google.token = accessToken;
                    User.google.name = profile.displayName;
                    User.google.email = profile.emails[0].value; // pull the first email
                    User.google.picture = picture;
                    User.admin = true;
                    return done(null, User);
                }else{
                    return done(null, false);
                }
            });

        }));




    return passport;
};