(function() {
  var app, bodyParser, cookieParser, express;

  express = require('express');

  cookieParser = require('cookie-parser');

  bodyParser = require('body-parser');

  app = express();

  app.use(express["static"](__dirname + '/public'));

  app.use(cookieParser('secret'));

  app.use(bodyParser.urlencoded({
    extended: false
  }));

  app.set('views', __dirname + '/views');

  app.set('view engine', 'jade');

  app.get('/', function(req, res) {
    return res.render('index', {
      userName: req.cookies.user
    });
  });

  app.get('/login', function(req, res) {
    return res.render('login');
  });

  app.post('/login', function(req, res) {
    var name;
    name = req.body.login;
    res.cookie('user', name);
    return res.render('login', {
      alert: 'Successfully logged in!',
      userName: name
    });
  });

  app.get('/logout', function(req, res) {
    res.cookie('user', 'XXX', {
      maxAge: -1
    });
    return res.redirect('/');
  });

  app.listen(3000, function() {
    return console.log('Listening on port 3000');
  });

}).call(this);
