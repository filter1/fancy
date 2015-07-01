printBreadcrumb = (focusedConceptInOrderAsListofList) ->
		br = $('.breadcrumb')
		br.text ''
		br.append "<li><a terms='[[]]'><i class='glyphicon glyphicon-home'/></a></li>"

		lastIndex = focusedConceptInOrderAsListofList.length - 1
		if lastIndex
			for concept, i in focusedConceptInOrderAsListofList[0..lastIndex - 1]
				terms = JSON.stringify(focusedConceptInOrderAsListofList[0..i])
				conceptString = concept.join ' '
				br.append "<li><a terms='#{terms}'>#{conceptString}</a></li>"
		conceptString = focusedConceptInOrderAsListofList[lastIndex].join ' '
		br.append "<li>#{conceptString}</li>"