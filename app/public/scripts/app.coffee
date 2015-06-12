userLoggedIn = ->
	return $('#userName').length > 0

$ ->
	# why - 10? no clue.
	adaptHeight = $(window).height() - $('#search-bar').outerHeight(true) - $('header').outerHeight(true) - 10
	$('.col-md-6, #viz').height adaptHeight

	myNetwork = Network()
	
	d3.json "lattice.json", (json) ->
		myNetwork("#vis", json)

		# do this stuff after the json was loaded
		searchSubmit = ->
			newConcept = $('#searchText').val().split(' ')
			myNetwork.applyNewConceptToNetwork(newConcept, 'search')

		$('#searchButton').click -> searchSubmit()

		$('#searchText').keypress (e) ->
			if e.which == 13
				searchSubmit()
				return false	

		$('#history').on('click', '.list-group-item', ->
				text = $(this).find('.historyQuery').text().split(' ')
				myNetwork.applyNewConceptToNetwork(text, 'history')
			)

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
