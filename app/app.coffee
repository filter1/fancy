express = require 'express'
cookieParser = require 'cookie-parser'
bodyParser = require 'body-parser'
config = require 'config'
compress = require 'compression'
mongoose = require 'mongoose'
multer  = require 'multer'
fs = require 'fs'

##########
# Setup  #
##########

app = express()

app.use( compress() )
app.use( express.static __dirname + '/public' )
app.use( bodyParser.urlencoded { extended: false } )
app.use( bodyParser.json() )

app.set 'views', __dirname + '/views'
app.set 'view engine', 'jade'

upload = multer({ dest: 'uploads/' })

##########
# Models #
##########

mongoose.connect 'mongodb://localhost/test'

# ObjectId = mongoose.Schema.Types.ObjectId

datasetSchema = mongoose.Schema({
    _id: String,
    secret: String,
    maxDocuments: Number
  })

conceptSchema = mongoose.Schema({
		_id: String,
		dataset_id: { type: String, ref: 'Dataset' },
		intent: [String],
		extent: [{ type: String, ref: 'Document'}],
		children: [{ type: String, ref: 'Concept' }],
		parents: [{ type: String, ref: 'Concept' }]
	})

documentSchema = mongoose.Schema({
		_id: String,
		title: String,
		body: String,
		url: String 
	})

Dataset = mongoose.model('Dataset', datasetSchema)
Concept = mongoose.model('Concept', conceptSchema)
Document = mongoose.model('Document', documentSchema)

##########
# Routes #
##########

app.get '/', (_, res) -> res.render 'index'
app.get '/infos', (_, res) -> res.render 'infos'
app.get '/upload', (_, res) -> res.render 'upload'

uploadDataset = upload.single('file')

app.post '/upload', uploadDataset, (req, res) ->
	console.log req.body
	path = req.file.path

	datasetName = req.body.datasetName
	secret = req.body.secret

	new Dataset { _id: datasetName, secret: secret }
		.save (err, newDataset) ->
			if err
				res.sendStatus 500
			else
				newDatasetId = newDataset.id
				data = JSON.parse( fs.readFileSync path, 'utf8' )

				query = Concept.collection.initializeOrderedBulkOp()
				maxDocuments = -1
				for concept, index in data.lattice

					documents = (newDatasetId + id for id in concept.extensionNames)

					maxDocuments = Math.max maxDocuments, documents.length

					concatIds = newDatasetId + concept.id
					children = (newDatasetId + id for id in concept.childrenNames)
					parents = (newDatasetId + id for id in concept.parentNames)
					query.insert { _id: concatIds, intent: concept.intensionNames, extent: documents, children: children, parents: parents, dataset_id: newDatasetId }

					console.log "#{index} from #{data.lattice.length}"

				query.execute (err) -> res.sendStatus 500 if err

				newDataset.maxDocuments = maxDocuments
				newDataset.save (err) -> res.sendStatus 500 if err

				query = Document.collection.initializeOrderedBulkOp()
				for d in data.objects
					concatIds = newDatasetId + d.id
					query.insert {_id: concatIds, title: d.title, content: d.content, url: d.content}
				query.execute (err) -> res.sendStatus 500 if err

				res.end("success")

app.get '/:name', (req, res)->
	datasetName = req.params.name

	Dataset.find {}, (err, dataset) ->
		if err
			res.sendStatus 404
		else
			datasetNames = (d._id for d in dataset)

			if datasetName in datasetNames
				res.render 'index', {all: datasetNames, selected: datasetName}
			else
				res.sendStatus 404

app.get '/:name/start', (req, res) ->
	datasetName = req.params.name

	console.log 'new REQ'

	Dataset.findOne({_id: datasetName}).exec (err, datasetData) ->
		res.sendStatus 500 if err
		maxDocuments = datasetData.maxDocuments

		Concept
			.findOne({intent: [], dataset_id: datasetName})
			.populate 'extent'
			.populate 'children'
			.populate 'parents'
			.exec (err, data) ->
				res.sendStatus 500 if err
				result = {maxDocuments: maxDocuments, concept: data}
				res.json result


##########
# Listen #
##########

port = config.get "port"
app.listen( port, -> console.log "Listening on port #{port}" )