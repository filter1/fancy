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

ObjectId = mongoose.Schema.Types.ObjectId

entrySchema = mongoose.Schema({
    name: String,
    secret: String
  })

conceptSchema = mongoose.Schema({
		entry_id: { type: ObjectId, ref: 'Entry' },
		intension: [String],
		extension: [{ type: ObjectId, ref: 'Document' }],
		children: [{ type: ObjectId, ref: 'Concept' }],
		parents: [{ type: ObjectId, ref: 'Concept' }]
	})

conceptSchema.index {entry_id: 1, _id: -1 } # order first after entry, than after the id

documentSchema = mongoose.Schema({
		entry_id: { type: ObjectId, ref: 'Entry' },
		title: String,
		body: String,
		url: String
		# attributes: [String]	
	})

documentSchema.index {entry_id: 1, _id: -1 } # order first after entry, than after the id

Entry = mongoose.model('Entry', entrySchema)
Concept = mongoose.model('Concept', conceptSchema)
Document = mongoose.model('Document', documentSchema)


# order of the docuemnts is extremly important

##########
# Routes #
##########

app.get '/', (_, res) -> res.render 'index'
app.get '/infos', (_, res) -> res.render 'infos'
app.get '/upload', (_, res) -> res.render 'upload'

uploadEntry = upload.single('file')

app.post '/upload', uploadEntry, (req, res) ->
	console.log req.body
	path = req.file.path

	entryName = req.body.entryName
	secret = req.body.secret

	new Entry { name: entryName, secret: secret }
		.save (err, newEntry) ->
			if err
				console.log err
			else
				newEntryId = newEntry.id
				data = JSON.parse( fs.readFileSync path, 'utf8' )

				query = Document.collection.initializeOrderedBulkOp()

				for object in data.objects

					query.insert { title: object.title, content: object.content, url: object.url, entry_id: newEntryId }

				query.execute()

				query = Concept.collection.initializeOrderedBulkOp()

				for concept in data.lattice
					query.insert { intent: concept.intensionNames, extent: concept.extensionNames, children: concept.childrenNames, parents: concept.parentNames, entry_id: newEntryId }

				query.execute( (err) -> console.log err)
				console.log 'happy! success!'
				res.end("success")


##########
# Listen #
##########

port = config.get "port"
app.listen( port, -> console.log "Listening on port #{port}" )