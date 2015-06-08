$ ->
	adaptHeight = $(window).height() - $('#search-bar').outerHeight(true)
	$('.col-md-6, #viz').height adaptHeight

	myNetwork = Network()
	
	d3.json "lattice.json", (json) -> myNetwork("#vis", json)

	fillHistory()

	searchSubmit = ->
		newConcept = $('#searchText').val().split(' ')
		myNetwork.applyNewConceptToNetwork(newConcept)

	$('#searchButton').click -> searchSubmit()

	$('#searchText').keypress (e) ->
		if e.which == 13
			searchSubmit()
			return false	

	$('#history').on('click', '.list-group-item', ->
		text = $(this).find('.historyQuery').text().split(' ')
		console.log text
		myNetwork.applyNewConceptToNetwork(text)
		)

