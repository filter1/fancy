(function() {
  var Historyitem, Like, Linkclick, Sequelize, User, app, bodyParser, config, cookieParser, express, isAuthenticatedForData, port, sequelize;

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

  sequelize = new Sequelize(config.get("dbName"), config.get("dbUser"), config.get("dbPassword"), {
    host: 'localhost',
    dialect: 'mysql',
    'pool': false
  });

  sequelize.authenticate().done(function(err) {
    if (err) {
      return console.log("connection failed:" + err);
    } else {
      return console.log('connection success');
    }
  });

  User = sequelize.define('user', {
    name: {
      type: Sequelize.STRING,
      unique: true
    }
  });

  Like = sequelize.define('like', {
    document: {
      type: Sequelize.STRING
    }
  });

  Historyitem = sequelize.define('historyitem', {
    terms: {
      type: Sequelize.STRING
    },
    interaction: {
      type: Sequelize.STRING
    }
  });

  Linkclick = sequelize.define('linkclick', {
    document: {
      type: Sequelize.STRING
    }
  });

  User.hasMany(Like);

  User.hasMany(Linkclick);

  User.hasMany(Historyitem);

  Like.belongsTo(User);

  Linkclick.belongsTo(User);

  Historyitem.belongsTo(User);

  sequelize.sync({
    force: true
  }).then(function() {
    User.create({
      name: "Johannes"
    });
    return console.log('successfully created all tables');
  });

  User.findOne().then((function(u) {}));

  app.get('/', function(req, res) {
    return res.render('index', {
      userName: req.cookies.userName
    });
  });

  app.get('/login', function(req, res) {
    return res.render('login');
  });

  app.post('/login', function(req, res) {
    var userName;
    userName = req.body.userName;
    res.cookie('userName', userName);
    return User.create({
      name: userName
    }).then(function(user) {
      var alert;
      alert = {
        message: "Newly registered as " + userName + "!"
      };
      return res.render('login', {
        alert: alert,
        userName: userName
      });
    })["catch"](function(user) {
      var alert;
      alert = {
        message: "Welcome Back, " + userName + "!"
      };
      return res.render('login', {
        alert: alert,
        userName: userName
      });
    });
  });

  app.get('/logout', function(req, res) {
    res.cookie('userName', 'XXX', {
      maxAge: -1
    });
    return res.redirect('/');
  });

  isAuthenticatedForData = function(req, res, next) {
    var userName;
    userName = req.cookies.userName;
    if (userName) {
      User.findOne({
        where: {
          name: userName
        }
      }).then(function(user) {
        res.locals.user = user;
        return next();
      });
    }
    console.log('verification failed');
    return res.end();
  };

  app.get('/history', isAuthenticatedForData, function(req, res) {
    var user;
    user = res.locals.user;
    return user.getHistoryItems().then(function(rows) {
      return console.log(rows);
    });
  });

  app.post('/history', isAuthenticatedForData, function(req, res) {
    var user;
    console.log('new request to store history');
    user = res.locals.user;
    user.createHistoryitem({
      interaction: req.body.interaction,
      terms: req.body.terms
    }).then(function() {
      return console.log("successfully inserted");
    });
    return res.end();
  });

  port = config.get("port");

  app.listen(port, function() {
    return console.log("Listening on port " + port);
  });

}).call(this);
