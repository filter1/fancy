Network = () ->
	selection = "#vis"

	width = parseInt( d3.select(selection).style("width") )
	height = parseInt( d3.select(selection).style("height") )

	## constants ## 
	# used for bubble cloud
	jitter = 0.5
	collisionPadding = 10
	minCollisionRadius = 20

	# in pixels
	minRadius = 10
	maxRadius = 100

	# in em
	minFontSize = 1
	maxFontSize = 5

	# will be initialized later
	# depends on the number of concepts
	radiusScale = null
	fontScale = null

	curNodesData = []

	# d3 dictionaries will be setup at init
	conceptToId = null
	idToConcept = null
	documents = null

	# save selection of d3
	nodesG = null
	node = null

	# init as empty
	focusedConceptInOrderAsListofList = [[]] 

	force = d3.layout.force()

	# constructor for the Network
	network = (data) ->

		# set up scales based on lattice size
		maxNumDocuments = (n.extensionNames.length for n in data.lattice)
			.reduce (x, y) -> Math.max x, y

		radiusScale = d3.scale.log()
			.range [minRadius, maxRadius]
			.domain [1, maxNumDocuments]

		fontScale = d3.scale.sqrt()
			.range [minFontSize, maxFontSize]
			.domain [1, maxNumDocuments]

		setupData data

		vis = d3.select selection
			.append "svg"
			.attr "width", width
			.attr "height", height

		nodesG = vis.append "g"
			.attr "id", "nodes" 

		zoom = d3.behavior.zoom()
			.on "zoom", zoomed

		vis.call zoom

		force.on "tick", forceTick
			.size [width, height]
			.gravity 0
			.charge 0

		update()

	# update the focus on one concept
	update = () ->
		terms = getCurrentConceptTerms focusedConceptInOrderAsListofList

		# tranfrom to internal representation
		conceptProccessed = (c.toLowerCase() for c in terms).sort()
		curConcept = conceptToId.get conceptProccessed
		curNodesData = filterNodes curConcept
		
		force.nodes(curNodesData)
		updateNodes()

		force.start()

		focusedConceptFlatList = getCurrentConceptTerms focusedConceptInOrderAsListofList

		printResultList curConcept, documents

		$('.typeahead').typeahead('val', focusedConceptFlatList.join ' ')

		printBreadcrumb focusedConceptInOrderAsListofList

		#remove error if now on overview
		$('header .row h4').remove() if curConcept.parentNames.length

	# the user clicked on a bubble/node
	network.navigationClick = (newConcept) ->
		force.stop()

		newConceptTerms = newConcept.split ','
		# check if focus is 'empty'
		if focusedConceptInOrderAsListofList[0].length == 0
			focusedConceptInOrderAsListofList = [newConceptTerms]
		else
			focusedConceptInOrderAsListofList.push newConceptTerms
		saveNavigationToHistory focusedConceptInOrderAsListofList, 'click'

		update()

	# the user clicked on the breadcrumb
	network.navigationBreadcrumb = (data) ->
		force.stop()

		focusedConceptInOrderAsListofList = data
		saveNavigationToHistory focusedConceptInOrderAsListofList, 'breadcrumb'

		update()

	# the user clicked on a history items
	network.navigationHistory = (data) ->
		force.stop()

		focusedConceptInOrderAsListofList = data
		saveNavigationToHistory focusedConceptInOrderAsListofList, 'history'

		update()

	# the user enterd a query
	network.navigationSearch = (query) ->
		force.stop()

		# simplification just split query on ' '
		focusedConceptInOrderAsListofList = ([w.toLowerCase()] for w in query.split ' ' )
		x = ([w.toLowerCase()] for w in query.split ' ' ).sort()

		# if search fails, show overview & error
		unless conceptToId.has x
			focusedConceptInOrderAsListofList = [[]]
			$('header .row').append '<h4><span class="label label-danger">No results. Showing Overview.</span></h4>'
		else
			saveNavigationToHistory focusedConceptInOrderAsListofList, 'search'

		update()

	# after loading the data, pressed into internal data strucutres
	setupData = (data) ->
		nodes = data.lattice

		nodes.forEach (n) -> 
			n.radius = radiusScale(n.extensionNames.length)

		# set force but don't go below a minimum
		nodes.forEach (d,i) -> d.forceR = Math.max(minCollisionRadius, radiusScale(d.extensionNames.length))

		idToConcept = d3.map nodes, (x) -> x.id
		conceptToId = d3.map nodes, (x) -> (c.toLowerCase() for c in x.intensionNames).sort()
		documents = d3.map data.objects, (x) -> x.id

	# only select neighoring nodes
	filterNodes = (curConcept) ->
		filterdNodes = curConcept.childrenNames.map (x) -> idToConcept.get x

		# filter out node without any data
		# In general, should not included in the first place
		filterdNodes = filterdNodes.filter (x) -> (x.extensionNames.length > 0)
			
	# only show the new terms as node label
	formatLabelText = (node) ->
		lowerdNodeText = (w.toLowerCase() for w in node.intensionNames)
		focusedNodeText = getCurrentConceptTerms focusedConceptInOrderAsListofList
		lowerdNodeText.filter (x) -> focusedNodeText.indexOf(x) < 0

	# update the bubbles/nodes in the view
	updateNodes = ->
		node = nodesG.selectAll "g.node"
			.data curNodesData, (d) -> d.id
		
		node.enter()
			.append 'g'
			.attr 'class', 'node'
			.call force.drag

		# TODO: fix, this is a hack
		# Without removing the elements, we would insert a new circle
		# and text every time we update the graph for the same node iff it is in the same view twice.
		# This problem exists because the label are updated after a navigation
		# Fixing this (for instance remove the label text from the node)
		# will increase performance
		node.selectAll("*").remove()

		# I failed to style it with css. It would be better to split it up.
		node.append "circle"
			.attr "r", (d) -> d.radius
			.style("stroke", '#dfdfdf')
			.style("stroke-width", 2)
			.style("fill", "white")

		node.append "text"
			.text formatLabelText
			.attr "class", "nodeLabel"
			.style "font-size", (x) ->"#{fontScale(x.extensionNames.length)}em"
			.attr "dy", "0.25em"

		node.append "text"
			.text (x) -> x.extensionNames.length
			.attr "class", "countLabel"
			.attr "dy", "1.5em"

		# functions are below
		node.on "mouseover", showDetails
			.on "mouseout", hideDetails
			.on "click", clickFunction

		# Removing Old Nodes.
		node.exit().remove()

	showDetails = (d, i) ->
		d3.select(this).select('circle').style("stroke-width", 4.0)
		d3.select(this).select('.countLabel').style("display", "inline")

	hideDetails = (d, i) ->
		d3.select(this).select('circle').style("stroke-width", 2.0)
		d3.select(this).select('.countLabel').style("display", "none")
	
	clickFunction = (d, i) ->
		x = d3.select(this).select('text').text()
		network.navigationClick(x)

	forceTick = (e) ->
		dampenAlpha = e.alpha * 0.1
		node
			.each(gravity(dampenAlpha))
			.each(collide(jitter))
			.attr("transform", (d, i) -> "translate(#{d.x},#{d.y})")

	gravity = (alpha) ->
		 # start with the center of the display
		cx = width / 2
		cy = height / 2

		# use alpha to affect how much to push
		# towards the horizontal or vertical
		ratio = height / width
		ax = alpha * ratio
		ay = alpha / ratio

		# return a function that will modify the
		# node's x and y values
		(d) ->
			d.x += (cx - d.x) * ax
			d.y += (cy - d.y) * ay	

	collide = (jitter) ->
		# return a function that modifies
		# the x and y of a node
		(d) ->
			curNodesData.forEach (d2) ->
				# check that we aren't comparing a node
				# with itself
				if d != d2
					# use distance formula to find distance
					# between two nodes
					x = d.x - d2.x
					y = d.y - d2.y
					distance = Math.sqrt(x * x + y * y)
					# find current minimum space between two nodes
					# using the forceR that was set to match the 
					# visible radius of the nodes
					minDistance = d.forceR + d2.forceR + collisionPadding

					# if the current distance is less then the minimum
					# allowed then we need to push both nodes away from one another
					if distance < minDistance
						# scale the distance based on the jitter variable
						distance = (distance - minDistance) / distance * jitter
						# move our two nodes
						moveX = x * distance
						moveY = y * distance
						d.x -= moveX
						d.y -= moveY
						d2.x += moveX
						d2.y += moveY

	# used for zooming in the svg
	zoomed = ->
		nodesG.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")

	network
