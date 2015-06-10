KEY = "history"

getHistoryFromLocalStorage = ->
	if Modernizr.localstorage 
		dataRaw = localStorage.getItem KEY
		if dataRaw
			return JSON.parse dataRaw
		else
			return null

saveQueryToHistory = (curConceptList, interaction) ->
	history = getHistoryFromLocalStorage()
	history = [] if not history

	historyItem = {'terms': curConceptList, 'interaction': interaction }
	history.push historyItem
	historyAsString = JSON.stringify history
	localStorage.setItem KEY, historyAsString

	printToHistoryList historyItem
	sendToServer historyItem

fillHistory = ->
	history = getHistoryFromLocalStorage()
	if history
		for historyItem in history
			printToHistoryList row

printToHistoryList = (historyItem) ->
	date = new Date historyItem['date']
		.toDateString()
	terms = historyItem['terms'].join ' '
	$('#history .list-group').prepend "<a href='#' class='list-group-item'> <span class='historyQuery'>#{terms}</span></a>"

sendToServer = (historyItem) ->
	$.post '/history', historyItem, -> console.log 'und?'