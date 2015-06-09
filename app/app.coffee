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
# Routes #
##########

app.get '/', (req, res) -> res.render 'index', {userName: req.cookies.user}

app.get '/login', (req, res) -> res.render 'login'
app.post '/login', (req, res) ->
	name = req.body.login
	res.cookie 'user', name
	res.render 'login', {alert: 'Successfully logged in!', userName: name}

app.get '/logout', (req, res) ->
	res.cookie 'user', 'XXX', {maxAge: -1}
	res.redirect '/'

##########
# Models #
##########

sequelize = new Sequelize( config.get("dbName"), config.get("dbUser"), config.get("dbPassword") , {
  host: 'localhost',
  dialect: 'mysql',
})

sequelize.authenticate().done( (err) ->
  if err
    console.log('Unable to connect to the database:', err)
  else
    console.log('Connection has been established successfully.')
)

User = sequelize.define('user', {
  name: { type: Sequelize.STRING }
})

Like = sequelize.define('like', {
  document: { type: Sequelize.STRING }
})

# save date because users' history will be logged without been logged in.
Query = sequelize.define('query', {
  term: { type: Sequelize.STRING },
  date: { type: Sequelize.DATE },
  interaction: { type: Sequelize.STRING }
})

LinkClicks = sequelize.define('linkclicks', {
  document: { type: Sequelize.STRING }
})

User.hasMany(Like)
User.hasMany(LinkClicks)
User.hasMany(Query)

# sequelize.sync({force: true}).then( ->
#   cons
#   return User.create({name: 'Johannes'})
# )

sequelize.sync().then( -> console.log 'successfully created all tables' )

##########
# Listen #
##########

port = config.get("port")
app.listen( port, -> console.log "Listening on port #{port}" )