# this is a hack
userLoggedIn = ->
	return $('#userName').length > 0

$ ->
	# Manage History
	if Modernizr.sessionstorage
		if userLoggedIn()
			if sessionStorage.getItem KEY_UNSYNCED
				# calls other functions here
				sendUnsyncedToServer()
			else
				# calls other functions here
				getHistoryFromServer()
		else
			printHistory()

	# why - 10? no clue.
	adaptHeight = $(window).height() - $('#search-bar').outerHeight(true) - $('header').outerHeight(true) - 10
	$('.col-md-6, #viz').height adaptHeight

	myNetwork = Network()
	
	d3.json "lattice.json", (json) ->
		myNetwork "#vis", json

		# do this stuff after the json was loaded
		searchSubmit = ->
			newConcept = $('#searchText').val().split ' '
			myNetwork.applyNewConceptToNetwork newConcept, 'search'

		$('#searchButton').click -> searchSubmit()

		# submit on enter button
		$('#searchText').keypress (e) ->
			if e.which == 13
				searchSubmit()
				return false	

		$('#history').on('click', '.list-group-item', ->
				text = $(this).find '.historyQuery'
					.text().split ' / ' # / is the delimiter
				myNetwork.applyNewConceptToNetwork text, 'history'
			)

		$('.breadcrumb').on('click', 'a', ->
				text = $(this).attr 'terms'
					.split ' '
				myNetwork.applyNewConceptToNetwork text, 'breadcrumb'
			)
