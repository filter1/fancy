# flatten list
@getCurrentConceptTerms = (focusedConceptInOrderAsListofList) ->
	# console.log focusedConceptInOrderAsListofList
	return focusedConceptInOrderAsListofList.reduce (a, b) -> a.concat b

# this is a hack, but it is not really important
# the user authorization will take place in the backend
@userLoggedIn = ->
	return $('#logout').length > 0
