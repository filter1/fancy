KEY_HISTORY = "history"
KEY_UNSYNCED = "unsynced"

getHistoryDataFromSessionStorage = (key) ->
	if Modernizr.sessionstorage 
		dataRaw = sessionStorage.getItem key
		if dataRaw
			return JSON.parse dataRaw
		else
			return null

setHistoryDataToSessionStorage = (dataRaw, key) ->
	if Modernizr.sessionstorage
		historyAsString = JSON.stringify dataRaw
		sessionStorage.setItem key, historyAsString	

saveNavigationActionToSessionStorage = (historyItem, key) ->
	history = getHistoryDataFromSessionStorage key
	history = [] if not history # create if not existent
	history.push historyItem
	setHistoryDataToSessionStorage history, key

saveNavigationToHistory = (data, interaction) ->
	historyItem = {'terms': data, 'interaction': interaction }
	printToHistoryListItem historyItem

	# ony send to server is user is logged in
	if userLoggedIn()
		saveNavigationActionToSessionStorage(historyItem, KEY_HISTORY)
		sendToServer historyItem
	else
		saveNavigationActionToSessionStorage(historyItem, KEY_UNSYNCED)

# updates UI
printHistory = ->
	if userLoggedIn()
		key = KEY_HISTORY
	else
		key = KEY_UNSYNCED

	history = getHistoryDataFromSessionStorage key
	if history
		for historyItem in history
			printToHistoryListItem historyItem

printToHistoryListItem = (historyItem) ->
	items = historyItem['terms']
	# only print if results are empty
	if items
		data = JSON.stringify items

		terms = (w.join(' ') for w in items).join ' / '

		$('#history .list-group').prepend "<a href='#' class='list-group-item'> <span class='historyQuery' terms=#{data}>#{terms}</span></a>"

# send one 'navigation action' to the server
sendToServer = (historyItem) ->
	$.post '/history', { history: JSON.stringify ([ historyItem ]) }

# when user logs in and he already navigated thru the lattice, the data is send to the server
# TODO: Send data as JSON and do not stringify/de-stringify it
sendUnsyncedToServer = ->
	history = getHistoryDataFromSessionStorage KEY_UNSYNCED
	if history
		$.post '/history', { history: JSON.stringify history }, ->
			console.log 'synced history to server'
			sessionStorage.removeItem KEY_UNSYNCED
			getHistoryFromServer()

# query server to get history for current user
# saves to local storage
# and updates UI
getHistoryFromServer = ->
	$.getJSON '/history', (items) -> 
		result = ( { terms: JSON.parse(item.terms), interaction: item.interaction } for item in items)

		setHistoryDataToSessionStorage result, KEY_HISTORY
		printHistory()
