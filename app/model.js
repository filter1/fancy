(function() {
  var connection, mysql;

  mysql = require('mysql');

  connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    database: 'name'
  });

  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    return console.log('connected as id ' + connection.threadId);
  });

}).call(this);
