express = require 'express'
cookieParser = require 'cookie-parser'
bodyParser = require 'body-parser'
Sequelize = require 'sequelize'
config = require 'config'


##########
# Setup  #
##########

app = express()

app.use( express.static __dirname + '/public' )
app.use( cookieParser 'secret' )
app.use( bodyParser.urlencoded { extended: false } )

app.set 'views', __dirname + '/views'
app.set 'view engine', 'jade'


##########
# Models #
##########

sequelize = new Sequelize( config.get("dbName"), config.get("dbUser"), config.get("dbPassword") , {
  host: 'localhost',
  dialect: 'mysql',
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
	  document: { type: Sequelize.STRING }
	}

# save date because users' history will be logged without been logged in.
Query = sequelize.define 'query', {
	  term: { type: Sequelize.STRING },
	  date: { type: Sequelize.DATE },
	  interaction: { type: Sequelize.STRING }
	}

LinkClicks = sequelize.define 'linkclicks', {
	  document: { type: Sequelize.STRING }
	}

User.hasMany Like
User.hasMany LinkClicks
User.hasMany Query

sequelize.sync({force: true}).then( -> console.log 'successfully created all tables' )


##########
# Routes #
##########

app.get '/', (req, res) -> res.render 'index', {userName: req.cookies.user}

app.get '/login', (req, res) -> res.render 'login'
app.post '/login', (req, res) ->
	name = req.body.login
	res.cookie 'user', name

	User.create {name: name}
		.then (user) ->
			alert = { message: 'Successfully logged in!' }
			res.render 'login', { alert: alert, userName: name }
		.catch (user) ->
			alert = { message: "Failed to loing as #{name}", type: 'fail' }
			res.render 'login', { alert: alert }

app.get '/logout', (req, res) ->
	res.cookie 'user', 'XXX', {maxAge: -1}
	res.redirect '/'


##########
# Listen #
##########

port = config.get "port"
app.listen( port, -> console.log "Listening on port #{port}" )