Network = () ->
	width = parseInt(d3.select("#vis").style("width"))
	height = parseInt(d3.select("#vis").style("height"))

	jitter = 0.5
	collisionPadding = 10
	minCollisionRadius = 20

	minRadius = 10
	maxRadius = 40

	radiusScale = d3.scale.sqrt().range([minRadius, maxRadius]).domain([0,100])

	fontScale = d3.scale.linear().range([8, 16]).domain([0, 100])

	allNodes = []

	curLinksData = []
	curNodesData = []
	linkedByIndex = {}

	# d3 dictionaries will be setup at init
	conceptToId = null
	idToConcept = null
	documents = null

	nodesG = null
	node = null

	# initialize without any concept
	curConcept = null
	curConceptAsListInOrderOfNavigation = null

	force = d3.layout.force()

	network = (selection, data) ->
		setupData(data)

		vis = d3.select(selection).append("svg")
			.attr("width", width)
			.attr("height", height)
		nodesG = vis.append("g").attr("id", "nodes")

		zoom = d3.behavior.zoom()
			.on("zoom", zoomed)

		vis.call(zoom)

		force.on("tick", forceTick)
			.size([width, height])
			.gravity(0)
			.charge(0)

		update()

	update = () ->
		curNodesData = filterNodes(allNodes)
		
		force.nodes(curNodesData)
		updateNodes()

		force.start()

		# if already something set - no start
		if curConcept
			printResultList(curConcept, documents)
			$('#search-bar input').val curConceptAsListInOrderOfNavigation.join ' '

	network.applyNewConceptToNetwork = (newConceptList) ->
		force.stop()

		# tranfrom to internal representation
		conceptProccessed = (c.toLowerCase() for c in newConceptList).sort()
		curConcept = conceptToId.get conceptProccessed

		curConceptAsListInOrderOfNavigation = adaptQueryRepresentation(curConceptAsListInOrderOfNavigation, newConceptList)

		saveQueryToHistory(curConceptAsListInOrderOfNavigation)

		update()
		
	setupData = (data) ->
		nodes = data.lattice

		nodes.forEach (n) -> 
			n.radius = radiusScale(n.extensionNames.length)

		nodes.forEach (d,i) -> d.forceR = Math.max(minCollisionRadius, radiusScale(d.extensionNames.length))

		idToConcept = d3.map(nodes, (x) -> x.id)
		conceptToId = d3.map(nodes, (x) -> x.intensionNames.sort())
		documents = d3.map(data.objects, (x) -> x.id)

		allNodes = nodes

	filterNodes = (allNodes) ->
		filterdNodes = []
		if curConcept
			# filterdNodes.push(curConcept)
			# filterdNodes = filterdNodes.concat curConcept.parentNames.map (x) -> idToConcept.get x
			filterdNodes = filterdNodes.concat curConcept.childrenNames.map (x) -> idToConcept.get x
			
		filterdNodes

	createLabels = (x, y) ->
		whatIsInXButNotInY(x, y)

	formatLabelText = (node) ->
		text = createLabels(node.intensionNames, curConcept.intensionNames)

	# strikeThru = (d) ->
	# 	if d.intensionNames.length < curConcept.intensionNames.length
	# 		'line-through'
	# 	else
	# 		'none'

	updateNodes = ->
		node = nodesG.selectAll "g.node"
			.data(curNodesData, (d) -> d.id)
		
		node.enter()
			.append 'g'
			.attr('class', 'node')
			.call force.drag

		# TODO: fix, this is a hack
		# Without removing the elements, we would insert a new circle
		# and text every time we update the graph.
		node.selectAll("*").remove()

		node.append "circle"
			.attr("r", (d) -> d.radius)
			.style("stroke", '#dfdfdf')
			.style("stroke-width", 1)
			.style("fill", "white")

		node.append "text"
			.text(formatLabelText)
			.attr("class", "nodeLabel")
			.style("font-size", (x) ->"#{fontScale(x.extensionNames.length)}px")
			# .attr("text-decoration", strikeThru)

		node.append "text"
			.text((x) -> x.extensionNames.length)
			.attr("class", "count")
			.attr("dy", "1.1em")

		node.on("mouseover", showDetails)
			.on("mouseout", hideDetails)
			.on("click", navigateNewConcept)

		node.exit().remove()

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

	zoomed = ->
		nodesG.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
	
	showDetails = (d, i) ->
		d3.select(this).select('circle')
			.style("stroke-width", 2.0)
			.attr("r", (d) -> String(d.radius + collisionPadding))

		d3.select(this).select('text').style("font-weight", "bold")
			# .style("font-size", "2em")

	hideDetails = (d, i) ->
		node.select('circle')
			.style("stroke-width", 1.0)
			.attr("r", (d) -> String(d.radius))

		node.select('text').style("font-weight", "normal")
			# .style("font-size", "1em")
	
	navigateNewConcept = (d, i) ->
		network.applyNewConceptToNetwork(d.intensionNames)

	network
