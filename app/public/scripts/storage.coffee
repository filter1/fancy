KEY_HISTORY = "history"
KEY_UNSYNCED = "unsynced"

getHistoryFromSessionStorage = (key) ->
	if Modernizr.sessionstorage 
		dataRaw = sessionStorage.getItem key
		if dataRaw
			return JSON.parse dataRaw
		else
			return null

setHistoryToSessionStorage = (dataRaw, key) ->
	if Modernizr.sessionstorage
		historyAsString = JSON.stringify dataRaw
		sessionStorage.setItem key, historyAsString	

saveIt = (historyItem, key) ->
	history = getHistoryFromSessionStorage key
	history = [] if not history
	history.push historyItem
	setHistoryToSessionStorage history, key

saveQueryToHistory = (curConceptList, interaction) ->
	console.log curConceptList

	curConceptString = curConceptList.join ' / '
	historyItem = {'terms': curConceptString, 'interaction': interaction }
	printToHistoryList historyItem

	if userLoggedIn()
		console.log 'User is logged in. Save to Server.'
		saveIt(historyItem, KEY_HISTORY)
		sendToServer historyItem
	else
		console.log 'Not logged in.'
		saveIt(historyItem, KEY_UNSYNCED)

printHistory = ->
	if userLoggedIn()
		key = KEY_HISTORY
	else
		key = KEY_UNSYNCED

	history = getHistoryFromSessionStorage key
	if history
		for historyItem in history
			printToHistoryList historyItem

printToHistoryList = (historyItem) ->
	terms = historyItem['terms']
	if terms
		$('#history .list-group').prepend "<a href='#' class='list-group-item'> <span class='historyQuery'>#{terms}</span></a>"

sendToServer = (historyItem) ->
	$.post '/history', { history: JSON.stringify ([ historyItem ]) }, -> console.log 'sent item to server'

# Fix this to send this data as JSON.
sendUnsyncedToServer = ->
	history = getHistoryFromSessionStorage KEY_UNSYNCED
	if history
		$.post '/history', { history: JSON.stringify history }, ->
			console.log 'synced history to server'
			sessionStorage.removeItem KEY_UNSYNCED
			getHistoryFromServer()

getHistoryFromServer = ->
	$.getJSON '/history', (items) -> 
		console.log 'got items'
		console.log items
		result = ( { terms: item.terms, interaction: item.interaction } for item in items)

		setHistoryToSessionStorage result, KEY_HISTORY
		printHistory()
