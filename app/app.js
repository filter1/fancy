(function() {
  var Historyitem, Like, Linkclick, Sequelize, User, app, bodyParser, compress, config, cookieParser, express, isAuthenticatedForData, port, sequelize;

  express = require('express');

  cookieParser = require('cookie-parser');

  bodyParser = require('body-parser');

  Sequelize = require('sequelize');

  config = require('config');

  compress = require('compression');

  app = express();

  app.use(compress());

  app.use(express["static"](__dirname + '/public'));

  app.use(cookieParser('secret'));

  app.use(bodyParser.urlencoded({
    extended: false
  }));

  app.use(bodyParser.json());

  app.set('views', __dirname + '/views');

  app.set('view engine', 'jade');

  sequelize = new Sequelize(config.get("dbName"), config.get("dbUser"), config.get("dbPassword"), {
    host: 'localhost',
    dialect: 'mysql'
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
    documentURL: {
      type: Sequelize.STRING,
      unique: true
    },
    documentTitle: {
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

  if (config.has("recreateDb")) {
    sequelize.sync({
      force: true
    }).then(function() {
      User.create({
        name: "Johannes"
      });
      return console.log('successfully created all tables');
    });
  } else {
    sequelize.sync().then(function() {
      return console.log('synced databases');
    });
  }

  app.get('/', function(req, res) {
    return res.render('index', {
      userName: req.cookies.userName
    });
  });

  app.get('/infos', function(req, res) {
    return res.render('infos', {
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
      return User.findOne({
        where: {
          name: userName
        }
      }).then(function(user) {
        res.locals.user = user;
        console.log("verification success " + userName);
        return next();
      });
    } else {
      res.status(403);
      return res.end();
    }
  };

  app.get('/history', isAuthenticatedForData, function(req, res) {
    var user;
    console.log('new request to get history data');
    user = res.locals.user;
    return user.getHistoryitems().then(function(items) {
      console.log(items);
      return res.json(items);
    });
  });

  app.post('/history', isAuthenticatedForData, function(req, res) {
    var history, i, item, len, user;
    console.log('new request to store history');
    user = res.locals.user;
    history = JSON.parse(req.body.history);
    for (i = 0, len = history.length; i < len; i++) {
      item = history[i];
      user.createHistoryitem({
        interaction: item.interaction,
        terms: JSON.stringify(item.terms)
      }).then(function() {
        return console.log("successfully inserted new history");
      });
    }
    return res.end();
  });

  app.post('/likes', isAuthenticatedForData, function(req, res) {
    var documentTitle, documentURL, user;
    console.log('new request to store likes');
    user = res.locals.user;
    documentURL = req.body.documentURL;
    documentTitle = req.body.documentTitle;
    user.createLike({
      documentURL: documentURL,
      documentTitle: documentTitle
    }).then(function() {
      return console.log('new like saved');
    });
    res.end();
    return res.end();
  });

  app.get('/likes', isAuthenticatedForData, function(req, res) {
    var user;
    user = res.locals.user;
    return user.getLikes().then(function(documents) {
      return res.render('likes', {
        documents: documents,
        userName: user.get('name')
      });
    })["catch"](function() {
      return res.end();
    });
  });

  port = config.get("port");

  app.listen(port, function() {
    return console.log("Listening on port " + port);
  });

}).call(this);
