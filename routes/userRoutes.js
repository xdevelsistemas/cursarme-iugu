'use strict';
const verificaAutenticacao = require('../services/verificaAutenticacao.js');
// load the auth variables from mongo

module.exports = function (app, passport) {

    let userController = require('../controller/userController')(passport);


    // LOGOUT ==============================
    app.get('/logout', function (req, res) {
        req.session.destroy();
        req.logout();
        res.redirect('/');
    });

    // GOOGLE ROUTES =======================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    // the callback after google has authenticated the user
    app.route('/auth/google').get(userController.authenticateGoogle(passport));
    app.route('/auth/google/callback').get(userController.authenticateGoogleCallBack(passport));



    // Facebook Routes ======================
    app.get('/auth/facebook',
        passport.authenticate('facebook'));

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: '/' } ),userController.login);






    app.route('/user/picture').get(verificaAutenticacao,userController.getPictureUrl);
    app.route('/user/logout').get(verificaAutenticacao,userController.logout );
    app.route('/user/json').get(verificaAutenticacao,userController.json);

    app.route('/login').get(function(req, res, next) {
        res.render('login');
    });


    return app;
};


