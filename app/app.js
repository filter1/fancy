(function() {
  var Like, LinkClicks, Query, Sequelize, User, app, bodyParser, config, cookieParser, express, port, sequelize;

  express = require('express');

  cookieParser = require('cookie-parser');

  bodyParser = require('body-parser');

  Sequelize = require('sequelize');

  config = require('config');

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

  sequelize = new Sequelize(config.get("dbName"), config.get("dbUser"), config.get("dbPassword"), {
    host: 'localhost',
    dialect: 'mysql'
  });

  sequelize.authenticate().done(function(err) {
    if (err) {
      return console.log('Unable to connect to the database:', err);
    } else {
      return console.log('Connection has been established successfully.');
    }
  });

  User = sequelize.define('user', {
    name: {
      type: Sequelize.STRING
    }
  });

  Like = sequelize.define('like', {
    document: {
      type: Sequelize.STRING
    }
  });

  Query = sequelize.define('query', {
    term: {
      type: Sequelize.STRING
    },
    date: {
      type: Sequelize.DATE
    },
    interaction: {
      type: Sequelize.STRING
    }
  });

  LinkClicks = sequelize.define('linkclicks', {
    document: {
      type: Sequelize.STRING
    }
  });

  User.hasMany(Like);

  User.hasMany(LinkClicks);

  User.hasMany(Query);

  sequelize.sync().then(function() {
    return console.log('successfully created all tables');
  });

  port = config.get("port");

  app.listen(port, function() {
    return console.log("Listening on port " + port);
  });

}).call(this);
