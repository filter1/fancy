(function() {
  var Concept, Dataset, Document, app, bodyParser, compress, conceptSchema, config, cookieParser, datasetSchema, documentSchema, express, fs, mongoose, multer, port, upload, uploadDataset,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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

  datasetSchema = mongoose.Schema({
    _id: String,
    secret: String,
    maxDocuments: Number
  });

  conceptSchema = mongoose.Schema({
    _id: String,
    dataset_id: {
      type: String,
      ref: 'Dataset'
    },
    intent: [String],
    extent: [
      {
        type: String,
        ref: 'Document'
      }
    ],
    children: [
      {
        type: String,
        ref: 'Concept'
      }
    ],
    parents: [
      {
        type: String,
        ref: 'Concept'
      }
    ]
  });

  documentSchema = mongoose.Schema({
    _id: String,
    title: String,
    body: String,
    url: String
  });

  Dataset = mongoose.model('Dataset', datasetSchema);

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

  uploadDataset = upload.single('file');

  app.post('/upload', uploadDataset, function(req, res) {
    var datasetName, path, secret;
    console.log(req.body);
    path = req.file.path;
    datasetName = req.body.datasetName;
    secret = req.body.secret;
    return new Dataset({
      _id: datasetName,
      secret: secret
    }).save(function(err, newDataset) {
      var children, concatIds, concept, d, data, documents, i, id, index, j, len, len1, maxDocuments, newDatasetId, parents, query, ref, ref1;
      if (err) {
        return res.sendStatus(500);
      } else {
        newDatasetId = newDataset.id;
        data = JSON.parse(fs.readFileSync(path, 'utf8'));
        query = Concept.collection.initializeOrderedBulkOp();
        maxDocuments = -1;
        ref = data.lattice;
        for (index = i = 0, len = ref.length; i < len; index = ++i) {
          concept = ref[index];
          documents = (function() {
            var j, len1, ref1, results;
            ref1 = concept.extensionNames;
            results = [];
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              id = ref1[j];
              results.push(newDatasetId + id);
            }
            return results;
          })();
          maxDocuments = Math.max(maxDocuments, documents.length);
          concatIds = newDatasetId + concept.id;
          children = (function() {
            var j, len1, ref1, results;
            ref1 = concept.childrenNames;
            results = [];
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              id = ref1[j];
              results.push(newDatasetId + id);
            }
            return results;
          })();
          parents = (function() {
            var j, len1, ref1, results;
            ref1 = concept.parentNames;
            results = [];
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              id = ref1[j];
              results.push(newDatasetId + id);
            }
            return results;
          })();
          query.insert({
            _id: concatIds,
            intent: concept.intensionNames,
            extent: documents,
            children: children,
            parents: parents,
            dataset_id: newDatasetId
          });
          console.log(index + " from " + data.lattice.length);
        }
        query.execute(function(err) {
          if (err) {
            return res.sendStatus(500);
          }
        });
        newDataset.maxDocuments = maxDocuments;
        newDataset.save(function(err) {
          if (err) {
            return res.sendStatus(500);
          }
        });
        query = Document.collection.initializeOrderedBulkOp();
        ref1 = data.objects;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          d = ref1[j];
          concatIds = newDatasetId + d.id;
          query.insert({
            _id: concatIds,
            title: d.title,
            content: d.content,
            url: d.content
          });
        }
        query.execute(function(err) {
          if (err) {
            return res.sendStatus(500);
          }
        });
        return res.end("success");
      }
    });
  });

  app.get('/:name', function(req, res) {
    var datasetName;
    datasetName = req.params.name;
    return Dataset.find({}, function(err, dataset) {
      var d, datasetNames;
      if (err) {
        return res.sendStatus(404);
      } else {
        datasetNames = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = dataset.length; i < len; i++) {
            d = dataset[i];
            results.push(d._id);
          }
          return results;
        })();
        if (indexOf.call(datasetNames, datasetName) >= 0) {
          return res.render('index', {
            all: datasetNames,
            selected: datasetName
          });
        } else {
          return res.sendStatus(404);
        }
      }
    });
  });

  app.get('/:name/start', function(req, res) {
    var datasetName;
    datasetName = req.params.name;
    console.log('new REQ');
    return Dataset.findOne({
      _id: datasetName
    }).exec(function(err, datasetData) {
      var maxDocuments;
      if (err) {
        res.sendStatus(500);
      }
      maxDocuments = datasetData.maxDocuments;
      return Concept.findOne({
        intent: [],
        dataset_id: datasetName
      }).populate('extent').populate('children').populate('parents').exec(function(err, data) {
        var result;
        if (err) {
          res.sendStatus(500);
        }
        result = {
          maxDocuments: maxDocuments,
          concept: data
        };
        return res.json(result);
      });
    });
  });

  port = config.get("port");

  app.listen(port, function() {
    return console.log("Listening on port " + port);
  });

}).call(this);
