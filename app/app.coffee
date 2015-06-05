express = require 'express'
cookieParser = require 'cookie-parser'
bodyParser = require 'body-parser'

app = express()

app.use( express.static __dirname + '/public' )
app.use( cookieParser 'secret' )
app.use( bodyParser.urlencoded {extended: false} )

app.set 'views', __dirname + '/views'
app.set 'view engine', 'jade'

app.get '/', (req, res) -> res.render 'index', {userName: req.cookies.user}

app.get '/login', (req, res) -> res.render 'login'
app.post '/login', (req, res) ->
	name = req.body.login
	res.cookie 'user', name
	res.render 'login', {alert: 'Successfully logged in!', userName: name}

app.get '/logout', (req, res) ->
	res.cookie 'user', 'XXX', {maxAge: -1}
	res.redirect '/'

app.listen 3000, -> console.log 'Listening on port 3000'