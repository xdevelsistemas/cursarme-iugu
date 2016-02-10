module.exports = () => {
    var userController = {};


    userController.json = function (req, res) {
        res.json({success: true, obj: {
            name: req.user.google.name,
            email: req.user.google.email
        }});
    };

    userController.authenticateGoogle = function(passport) {
        return passport.authenticate('google', { scope: ['email','profile'] });
    };

    userController.authenticateGoogleCallBack = function(passport){
        console.log('authenticateGoogleCallBack');
        return passport.authenticate('google', {
            successRedirect: '/dashboard',
            failureRedirect: '/login'
        });
    };

    function postLogin(req, res, next) {
        var fields = [];
        if(!req.body.username)fields.push('username');
        if(!req.body.password)fields.push('password');
        if(fields.length > 0){
            res.status(401).json(Boom.create(401,"Faltam informações para o login",{fields: fields}))
        }else{
            passport.authenticate('local', function(err, user, info) {
                if (err) return next(err);
                if (!user) {
                    return res.status(401).json({message: 'Usuário ou senha inválidos!'});
                }
                req.logIn(user, function(err) {
                    if (err) return next(err);
                    return res.status(200).json({success: true});
                });
            })(req, res, next);
        }
    }


    userController.login = (req,res) => {
        res.redirect('/dashboard');
    };



    userController.logout =   (req, res) => {
        req.session.destroy();
        req.logout();
        res.redirect('/login');
    };


    userController.getPictureUrl =  (req, res) => {
        return res.json(req.user.google.picture);
    };





    return userController;
};
