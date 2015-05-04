Network = () ->
	width = 500
	height = 500

	radiusScale = d3.scale.linear().range([20,30]).domain([0, 200])

	allNodes = []

	curLinksData = []
	curNodesData = []
	linkedByIndex = {}

	# d3 dicts will be setup at init
	conceptToId = null
	idToConcept = null
	documents = null

	nodesG = null
	linksG = null

	node = null
	link = null

	# initialise witout any concept
	curConcept = null

	force = d3.layout.force()

	network = (selection, data) ->
		setupData(data)

		vis = d3.select(selection).append("svg")
			.attr("width", width)
			.attr("height", height)
		linksG = vis.append("g").attr("id", "links")
		nodesG = vis.append("g").attr("id", "nodes")

		force.size([width, height])

		force.on("tick", forceTick)
			.charge(-500)
			.linkDistance( (d) -> d.weight)
			.size([width, height])

			# debug
		# setCurConcept = ['aguada']

		update()

	update = () ->
		curNodesData = filterNodes(allNodes)
		curLinksData = filterLinks(curNodesData)

		force.nodes(curNodesData)
		updateNodes()

		force.links(curLinksData)
		updateLinks()

		force.start()

		if curConcept
			conceptName = curConcept.intensionNames.join ' '
			details = $('#details').text ''
				.append "<h3>#{conceptName}</h3>"
			
			for docId in curConcept.extensionNames
				doc = documents.get(docId)
				details.append "<h4>#{doc.title}</h4>"
					.append "<p>#{doc.content}</p>"
					.append "<p>#{doc.notes}</p>"
					.append "<p>#{doc.references}</p>"
					.append "<p>#{doc.materia}</p>"
					.append "<p>#{doc.language}</p>"
					.append "<p>#{doc.nes}, #{doc.nes_location}, #{doc.nes_mis}, #{doc.nes_organization}, #{doc.nes_person}</p>"


	network.toggleFilter = (newFilter) ->
		force.stop()
		setCurConcept(newFilter)
		update()
		
	setupData = (data) ->
		nodes = data.lattice

		nodes.forEach (n) -> 
			n.radius = radiusScale(n.extensionNames.length)

		idToConcept = d3.map(nodes, (x) -> x.id)
		conceptToId = d3.map(nodes, (x) -> x.intensionNames.sort())
		documents = d3.map(data.objects, (x) -> x.id)

		console.log documents

		allNodes = nodes

	filterNodes = (allNodes) ->
		filterdNodes = []
		if curConcept
			filterdNodes.push(curConcept)
			filterdNodes = filterdNodes.concat curConcept.parentNames.map (x) -> idToConcept.get x
			filterdNodes = filterdNodes.concat curConcept.childrenNames.map (x) -> idToConcept.get x
		filterdNodes

	filterLinks = (curNodes) ->
		curLinks = []
		idToCurNodes = d3.map(curNodes, (x) -> x.id)

		for n in curNodes
			for pId in n.childrenNames
				if idToCurNodes.get(pId)
					curLinks.push {'source':idToConcept.get(n.id),'target':idToConcept.get(pId),'weight': randomnumber=Math.floor(Math.random()*height)/2}
		curLinks

	# y - x
	difArray = (x, y) ->
		return x.filter (z) -> 
			y.indexOf(z) < 0

	formatLabelText = (x, y) ->
		return x if x == y
		return difArray(x, y) if x.length > y.length
		return difArray(y, x)

	colorBy = (d) ->
		if d.intensionNames.length < curConcept.intensionNames.length
			return 'orange'
		return 'white'

	updateNodes = () ->
		node = nodesG.selectAll("g.xxx")
			.data(curNodesData, (d) -> d.id)
		
		node.enter()
			.append('g')
			.attr('class', 'xxx')
			# .attr('cy', 0)
			.call(force.drag)

		node.append("circle")
			.attr("class", "node")
			.attr("r", (d) -> d.radius)
			.style("fill", colorBy)
			.style("stroke", '#555')
			.style("stroke-width", 1.0)

		node.append("text")
			.text((x) -> formatLabelText(x.intensionNames, curConcept.intensionNames))
			.attr('class', 'label')

		node.on("mouseover", showDetails)
			.on("mouseout", hideDetails)
			.on("click", navigateNewConcept)

		node.exit().remove()

	updateLinks = () ->
		link = linksG.selectAll("line.link")
			.data(curLinksData, (d) -> "#{d.source.id}_#{d.target.id}")

		link.enter().append("line")
			.attr("class", "link")
			.attr("stroke", "#ddd")
			.attr("stroke-opacity", 0.8)
			.attr("x1", (d) -> d.source.x)
			.attr("y1", (d) -> d.source.y)
			.attr("x2", (d) -> d.target.x)
			.attr("y2", (d) -> d.target.y)

		link.exit().remove()

	# transform to internal filter representation
	setCurConcept = (newConcept) ->
		conceptProccessed = newConcept.sort()
		curConcept = conceptToId.get conceptProccessed

	forceTick = (e) ->
		node
			.attr("transform", (d, i) -> "translate(" + d.x + "," + d.y + ")")

		link
			.attr("x1", (d) -> d.source.x)
			.attr("y1", (d) -> d.source.y)
			.attr("x2", (d) -> d.target.x)
			.attr("y2", (d) -> d.target.y)

	showDetails = (d, i) ->
		d3.select(this).select('circle')
			.style("stroke-width", 2.0)

	hideDetails = (d, i) ->
		node.select('circle')
			.style("stroke-width", 1.0)

	navigateNewConcept = (d, i) ->
		network.toggleFilter(d.intensionNames)

	network

$ ->
	myNetwork = Network()
	
	d3.json "lattice.json", (json) ->
		myNetwork("#vis", json)

	$('#searchButton').click ->
		newFilter = $('#searchText').val().split(' ')
		myNetwork.toggleFilter(newFilter)
