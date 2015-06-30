# filter some stuff out
whatIsInXButNotInY = (x, y) ->
	x.filter (z) -> y.indexOf(z) < 0

# flatten list
@getCurrentConceptTerms = (focusedConceptInOrderAsListofList) ->
	console.log focusedConceptInOrderAsListofList
	return focusedConceptInOrderAsListofList.reduce (a, b) -> a.concat b