printResultList = (curConcept, documents) ->
	details = $('#details').text ''
		.append "#{curConcept.extensionNames.length} results<br>"
	
	i = 1
	for docId in curConcept.extensionNames
		doc = documents.get(docId)
		details.append "<h4>#{i}. #{doc.title}</h4>"
			.append "<p>#{doc.content}</p>"
			.append "<p>#{doc.notes}</p>"
			.append "<p>#{doc.references}</p>"
			.append "<p>#{doc.materia}</p>"
			.append "<p>#{doc.language}</p>"
			.append "<p>#{doc.nes}, #{doc.nes_location}, #{doc.nes_mis}, #{doc.nes_organization}, #{doc.nes_person}</p>"
		i += 1

	# marking all words that occur in concept
	# the "gi" stands for global (all occurences) and i for case insensitive
	reg = curConcept.intensionNames. join '|'
	details.html details.html().replace(new RegExp(reg, "gi"),'<strong>$&</strong>')