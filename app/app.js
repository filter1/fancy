(function() {
  var Concept, Document, Entry, ObjectId, app, bodyParser, compress, conceptSchema, config, cookieParser, documentSchema, entrySchema, express, fs, mongoose, multer, port, upload, uploadEntry;

  express = require('express');

  cookieParser = require('cookie-parser');

  bodyParser = require('body-parser');

  config = require('config');

  compress = require('compression');

  mongoose = require('mongoose');

  multer = require('multer');

  fs = require('fs');

  app = express();

  app.use(compress());

  app.use(express["static"](__dirname + '/public'));

  app.use(bodyParser.urlencoded({
    extended: false
  }));

  app.use(bodyParser.json());

  app.set('views', __dirname + '/views');

  app.set('view engine', 'jade');

  upload = multer({
    dest: 'uploads/'
  });

  mongoose.connect('mongodb://localhost/test');

  ObjectId = mongoose.Schema.Types.ObjectId;

  entrySchema = mongoose.Schema({
    name: String,
    secret: String
  });

  conceptSchema = mongoose.Schema({
    entry_id: {
      type: ObjectId,
      ref: 'Entry'
    },
    intension: [String],
    extension: [
      {
        type: ObjectId,
        ref: 'Document'
      }
    ],
    children: [
      {
        type: ObjectId,
        ref: 'Concept'
      }
    ],
    parents: [
      {
        type: ObjectId,
        ref: 'Concept'
      }
    ]
  });

  conceptSchema.index({
    entry_id: 1,
    _id: -1
  });

  documentSchema = mongoose.Schema({
    entry_id: {
      type: ObjectId,
      ref: 'Entry'
    },
    title: String,
    body: String,
    url: String
  });

  documentSchema.index({
    entry_id: 1,
    _id: -1
  });

  Entry = mongoose.model('Entry', entrySchema);

  Concept = mongoose.model('Concept', conceptSchema);

  Document = mongoose.model('Document', documentSchema);

  app.get('/', function(_, res) {
    return res.render('index');
  });

  app.get('/infos', function(_, res) {
    return res.render('infos');
  });

  app.get('/upload', function(_, res) {
    return res.render('upload');
  });

  uploadEntry = upload.single('file');

  app.post('/upload', uploadEntry, function(req, res) {
    var entryName, path, secret;
    console.log(req.body);
    path = req.file.path;
    entryName = req.body.entryName;
    secret = req.body.secret;
    return new Entry({
      name: entryName,
      secret: secret
    }).save(function(err, newEntry) {
      var concept, data, i, j, len, len1, newEntryId, object, query, ref, ref1;
      if (err) {
        return console.log(err);
      } else {
        newEntryId = newEntry.id;
        data = JSON.parse(fs.readFileSync(path, 'utf8'));
        query = Document.collection.initializeOrderedBulkOp();
        ref = data.objects;
        for (i = 0, len = ref.length; i < len; i++) {
          object = ref[i];
          query.insert({
            title: object.title,
            content: object.content,
            url: object.url,
            entry_id: newEntryId
          });
        }
        query.execute();
        query = Concept.collection.initializeOrderedBulkOp();
        ref1 = data.lattice;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          concept = ref1[j];
          query.insert({
            intent: concept.intensionNames,
            extent: concept.extensionNames,
            children: concept.childrenNames,
            parents: concept.parentNames,
            entry_id: newEntryId
          });
        }
        query.execute(function(err) {
          return console.log(err);
        });
        console.log('happy! success!');
        return res.end("success");
      }
    });
  });

  port = config.get("port");

  app.listen(port, function() {
    return console.log("Listening on port " + port);
  });

}).call(this);
