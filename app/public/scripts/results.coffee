@sendLikeToServer = (url, title, element) ->
	$.post( '/likes', { documentURL: url, documentTitle: title } )
		.done ->
			element.style.color = "FireBrick"
		.fail (err) ->
			alert 'You have to be logged in to save documents.'
			console.log err

printResultList = (curConcept, documents) ->
	details = $('#details .list-group').text ''
		# .append "#{curConcept.extensionNames.length} results<br>"
	
	resultingDocuments = curConcept.extensionNames

	$('#numResults').text resultingDocuments.length

	resultingDocuments = resultingDocuments[..100]

	i = 1
	for docId in resultingDocuments
		doc = documents.get(docId)

		# change id here
		url = "http://www.mcu.es/ccbae/es/consulta/resultados_busqueda.cmd?tipo_busqueda=mapas_planos_dibujos&posicion=1&forma=ficha&id=#{docId}"

		button = "<button class='btn pull-right' onclick='sendLikeToServer(\"#{url}\" ,\"#{doc.title}\", this);'>
    <span class='glyphicon glyphicon-heart'></span></button>"

		details.append("<li class='list-group-item'><a href='#{url}' target='_blank'><h4 class='list-group-item-heading'>#{doc.title}</h4></a><p class='list-group-item-text'>#{doc.content}</p>#{button}<div class='clearfix'/></li>")
		i += 1

		# marking all words that occur in concept
		# the "gi" stands for global (all occurences) and i for case insensitive
		# reg = curConcept.intensionNames. join '|'
		# details.html details.html().replace(new RegExp(reg, "gi"),'<strong>$&</strong>')
