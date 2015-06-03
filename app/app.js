(function() {
  var app, express;

  express = require('express');

  app = express();

  app.use(express["static"](__dirname + '/public'));

  app.set('view engine', 'jade');

  app.get('/', function(req, res) {
    return res.render('index');
  });

  app.listen(3000, function() {
    return console.log('Listening on port 3000');
  });

}).call(this);
