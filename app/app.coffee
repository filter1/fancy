express = require 'express'
cookieParser = require 'cookie-parser'
bodyParser = require 'body-parser'
Sequelize = require 'sequelize'
config = require 'config'
compress = require 'compression'


##########
# Setup  #
##########

app = express()

app.use( compress() )
app.use( express.static __dirname + '/public' )
app.use( cookieParser 'secret' )
app.use( bodyParser.urlencoded { extended: false } )
app.use( bodyParser.json() )



app.set 'views', __dirname + '/views'
app.set 'view engine', 'jade'


##########
# Models #
##########

sequelize = new Sequelize( config.get("dbName"), config.get("dbUser"), config.get("dbPassword") , {
		host: 'localhost',
		dialect: 'mysql'
		})

sequelize.authenticate().done( (err) ->
	if err
		console.log "connection failed:#{err}"
	else
		console.log 'connection success'
)

User = sequelize.define 'user', {
		name: { type: Sequelize.STRING, unique: true }
	}

Like = sequelize.define 'like', {
		documentURL: { type: Sequelize.STRING, unique: true }
		documentTitle: { type: Sequelize.STRING }
	}

# save date because users' history will be logged without been logged in.
Historyitem = sequelize.define 'historyitem', {
		terms: { type: Sequelize.STRING },
		interaction: { type: Sequelize.STRING }
	}

Linkclick = sequelize.define 'linkclick', {
		document: { type: Sequelize.STRING }
	}

User.hasMany Like
User.hasMany Linkclick
User.hasMany Historyitem

Like.belongsTo User
Linkclick.belongsTo User
Historyitem.belongsTo User

sequelize.sync({force: true}).then( ->
		User.create({name: "Johannes"})
		console.log 'successfully created all tables'
	)


##########
# Routes #
##########


app.get '/', (req, res) -> res.render 'index', { userName: req.cookies.userName }

app.get '/infos', (req, res) -> res.render 'infos', { userName: req.cookies.userName }

app.get '/login', (req, res) -> res.render 'login'
app.post '/login', (req, res) ->
	userName = req.body.userName
	res.cookie 'userName', userName

	User.create { name: userName }
		.then (user) ->
			alert = { message: "Newly registered as #{userName}!" }
			res.render 'login', { alert: alert, userName: userName }
		.catch (user) ->
			alert = { message: "Welcome Back, #{userName}!"}
			res.render 'login', { alert: alert, userName: userName }

app.get '/logout', (req, res) ->
	res.cookie 'userName', 'XXX', { maxAge: -1 }
	res.redirect '/'

# restrict data access
isAuthenticatedForData = (req, res, next) ->
	userName = req.cookies.userName

	if userName
		User.findOne { where: {name: userName}}
			.then (user) ->
				res.locals.user = user
				console.log "verification success #{userName}"
				return next()
	else
		res.status(403)
		res.end()

	# console.log "verification failed #{userName}"
	# return res.redirect('/')

app.get('/history', isAuthenticatedForData, (req, res) ->
	console.log 'new request to get history data'
	user = res.locals.user
	user.getHistoryitems().then( (items) ->
			console.log items
			res.json( items )
		)
	)

app.post('/history', isAuthenticatedForData, (req, res) ->
		console.log 'new request to store history'
		user = res.locals.user
		history = JSON.parse req.body.history
		for item in history
			user.createHistoryitem( {interaction: item.interaction, terms: item.terms} )
					.then( -> console.log "successfully inserted new history" )
		res.end()
	)

app.post('/likes', isAuthenticatedForData, (req, res) ->
		console.log 'new request to store likes'
		user = res.locals.user
		documentURL = req.body.documentURL
		documentTitle = req.body.documentTitle
		user.createLike( { documentURL: documentURL, documentTitle: documentTitle } )
			.then -> console.log 'new like saved'
			res.end()
		res.end()
	)

app.get('/likes', isAuthenticatedForData, (req, res) ->
		user = res.locals.user
		user.getLikes()
			.then (documents) ->
				res.render 'likes', {documents: documents, userName: user.get('name')}
			.catch ->
				res.end()
	)

##########
# Listen #
##########

port = config.get "port"
app.listen( port, -> console.log "Listening on port #{port}" )