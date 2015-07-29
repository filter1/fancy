$ ->
	manageHistory()

	# I don't know why I have to reduce it - 10. Feel free to fix it.
	adaptHeight = $(window).height() - $('#search-bar').outerHeight(true) - $('header').outerHeight(true) - 10
	$('.col-md-6, #viz').height adaptHeight

	myNetwork = Network()	

	# Load data from the server

	newUrl =  window.location.pathname + "/start"
	d3.json newUrl, (json) ->
		$('#vis').empty()

		console.log json

		myNetwork json

		# do this stuff after the json was loaded
		searchSubmit = ->
			query = $('#searchText').val()
			$('input').blur()
			myNetwork.navigationSearch query

		$('#searchButton').click -> searchSubmit()

		# submit search on enter button
		$('#searchText').keypress (e) ->
			if e.which == 13
				searchSubmit()
				return false	

		$('#history').on('click', '.list-group-item', ->
				text = $(this).find '.historyQuery'
					.attr 'terms'
				data = JSON.parse text
				myNetwork.navigationHistory data
			)

		$('.breadcrumb').on('click', 'a', ->
				text = $(this).attr 'terms'
				data = JSON.parse text
				myNetwork.navigationBreadcrumb data
			)

		# this sections manages the collapse items for results/history
		# when one gets closed, the other on oppens
		# so there is always at least on view/panel open
		$('#collapseOne').on 'hidden.bs.collapse', ->
			$('#collapseTwo').collapse 'show'

		$('#collapseTwo').on 'hidden.bs.collapse', ->
			$('#collapseOne').collapse 'show'

	# Load JSON for the typeahead in search field in parallel to the JSON for the lattice.

		$.getJSON 'data/suggestions.json', (suggestions) ->
			substringMatcher = (strs) ->
			  (q, cb) ->
			  	if q
				    matches = []
				    substrRegex = new RegExp("^" + q, 'i') # ignore case, start with q
				    $.each( strs, (i, str) -> matches.push str if substrRegex.test str )
			    	cb(matches)
			    else
			    	cb(strs[..20])
			$('.typeahead').typeahead({ highlight: true, minLength: 0 }, {
			  name: 'suggestions',
			  source: substringMatcher(suggestions),
			  limit: 20
			}).on('typeahead:selected', (e, data) -> searchSubmit() )