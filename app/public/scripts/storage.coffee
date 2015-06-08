key = "history"
getDataFromLocalStorage = ->
	if Modernizr.localstorage 
		dataRaw = localStorage.getItem key
		if dataRaw
			return JSON.parse dataRaw
		else
			return null

saveQueryToHistory = (curConceptList) ->
	data = getDataFromLocalStorage()
	data = [] if not data

	queryAndDate = {'date': +new Date(), 'query': curConceptList}
	data.push queryAndDate
	dataAsString = JSON.stringify data
	localStorage.setItem key, dataAsString

	addToHistoryList(queryAndDate)

fillHistory = ->
	data = getDataFromLocalStorage()
	if data
		for row in data
			addToHistoryList(row)

addToHistoryList = (row) ->
	date = new Date row['date']
		.toDateString()
	query = row['query'].join(' ')
	# $('#history .list-group').prepend "<a href='#' class='list-group-item'><span class='historyDate'>#{date}</span> <span class='historyQuery'>#{query}</span></a>"
	$('#history .list-group').prepend "<a href='#' class='list-group-item'> <span class='historyQuery'>#{query}</span></a>"

