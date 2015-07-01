@sendLikeToServer = (url, title, element) ->
	$.post( '/likes', { documentURL: url, documentTitle: title } )
		.done ->
			element.style.color = "FireBrick"
		.fail (err) ->
			alert 'You have to be logged in to save documents.'
			console.log err


@sendLinkclickToServer = (url) ->
	if userLoggedIn()
		$.post( '/linkclick', { url: url} )

printResultList = (curConcept, documents) ->

	details = $('#details .list-group').text ''
	
	resultingDocuments = curConcept.extensionNames
	nDocs = resultingDocuments.length

	$('#numResults').text nDocs

	if nDocs > 0
		resultingDocuments = resultingDocuments[..100]
		for docId in resultingDocuments
			doc = documents.get(docId)

			button = "<button class='btn pull-right' onclick='sendLikeToServer(\"#{doc.url}\" ,\"#{doc.title}\", this);'>
	    <span class='glyphicon glyphicon-heart'></span></button>"

			# marking all words that occur in concept
			# the "gi" stands for global (all occurences) and i for case insensitive
			reg = curConcept.intensionNames. join '|'
			la =  doc.content.replace(new RegExp(reg, "gi"),'<strong>$&</strong>')

			details.append("<li class='list-group-item'><a onclick='sendLinkclickToServer(\"#{doc.url}\"); return true;' href='#{doc.url}' target='_blank'><h4 class='list-group-item-heading'>#{doc.title}</h4></a><p class='list-group-item-text'>#{la}</p>#{button}<div class='clearfix'/></li>")



	else
		details.append "<div class='text-center' <br><br> No results.<br><br></div> "

