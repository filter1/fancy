express = require 'express'
app = express()

app.use( express.static (__dirname + '/public') )

app.set('views', __dirname + '/views')
app.set 'view engine', 'jade'

app.get '/', (req, res) -> res.render 'index'

app.listen 3000, -> console.log 'Listening on port 3000'