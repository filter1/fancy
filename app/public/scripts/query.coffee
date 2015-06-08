adaptQueryRepresentation = (curConceptListInOrder, newConceptList) ->
	if curConceptListInOrder
		# is the new string longer? if yes, what terms should be modified?
		if newConceptList.length >= curConceptListInOrder.length
			whatIsNew = whatIsInXButNotInY(newConceptList, curConceptListInOrder)

			# when there is a completly new search term
			if whatIsNew.length == newConceptList.length
				curConceptListInOrder = newConceptList
			else
				# append new terms
				curConceptListInOrder = curConceptListInOrder.concat whatIsNew
		else
			# only select terms that are still there
			curConceptListInOrder = (w for w in curConceptListInOrder when w in newConceptList)

			# when there is a completly new, shorter query
			if curConceptListInOrder.length == 0
				curConceptListInOrder = newConceptList

	else
		curConceptListInOrder = newConceptList

# filter some stuff out
whatIsInXButNotInY = (x, y) ->
	x.filter (z) -> y.indexOf(z) < 0
