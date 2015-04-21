(function() {
  var Network;

  Network = function() {
    var allData, circleRadius, conceptToId, curLinksData, curNodesData, filter, filterLinks, filterNodes, force, forceTick, height, hideDetails, link, linkedByIndex, linksG, mapNodes, neighboring, network, node, nodeCounts, nodesG, setFilter, setupData, showDetails, update, updateLinks, updateNodes, width;
    width = 700;
    height = 500;
    circleRadius = 20;
    allData = [];
    curLinksData = [];
    curNodesData = [];
    linkedByIndex = {};
    conceptToId = d3.map();
    nodesG = null;
    linksG = null;
    node = null;
    link = null;
    filter = '';
    force = d3.layout.force();
    network = function(selection, data) {
      var vis;
      allData = setupData(data);
      vis = d3.select(selection).append("svg").attr("width", width).attr("height", height);
      linksG = vis.append("g").attr("id", "links");
      nodesG = vis.append("g").attr("id", "nodes");
      force.size([width, height]);
      force.on("tick", forceTick).charge(-1000).linkDistance(100);
      setFilter('');
      return update();
    };
    update = function() {
      curNodesData = filterNodes(allData.nodes);
      curLinksData = filterLinks(allData.links, curNodesData);
      force.nodes(curNodesData);
      updateNodes();
      force.links(curLinksData);
      updateLinks();
      return force.start();
    };
    network.toggleFilter = function(newFilter) {
      force.stop();
      setFilter(newFilter);
      return update();
    };
    network.updateData = function(newData) {
      allData = setupData(newData);
      link.remove();
      node.remove();
      return update();
    };
    setupData = function(data) {
      var nodesMap;
      data.nodes.forEach(function(n) {
        var randomnumber;
        n.x = randomnumber = Math.floor(Math.random() * width);
        n.y = randomnumber = Math.floor(Math.random() * height);
        return n.radius = circleRadius;
      });
      nodesMap = mapNodes(data.nodes);
      data.links.forEach(function(l) {
        l.source = nodesMap.get(l.source);
        l.target = nodesMap.get(l.target);
        return linkedByIndex[l.source.id + ", " + l.target.id] = 1;
      });
      return data;
    };
    mapNodes = function(nodes) {
      var nodesMap;
      nodesMap = d3.map();
      nodes.forEach(function(n) {
        return nodesMap.set(n.id, n);
      });
      return nodesMap;
    };
    nodeCounts = function(nodes, attr) {
      var counts;
      counts = {};
      nodes.forEach(function(d) {
        var name;
        if (counts[name = d[attr]] == null) {
          counts[name] = 0;
        }
        return counts[d[attr]] += 1;
      });
      return counts;
    };
    neighboring = function(a, b) {
      return linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id];
    };
    filterNodes = function(allNodes) {
      var filterdNodes;
      filterdNodes = [];
      console.log(conceptToId);
      return filterdNodes.push(conceptToId.get(filter));
    };
    filterLinks = function(allLinks, curNodes) {
      curNodes = mapNodes(curNodes);
      return allLinks.filter(function(l) {
        return curNodes.get(l.source.id) && curNodes.get(l.target.id);
      });
    };
    updateNodes = function() {
      node = nodesG.selectAll("cirlce.node").data(curNodesData, function(d) {
        return d.id;
      });
      node.enter().append('g').attr('class', 'node').call(force.drag);
      node.append("circle").attr("class", "node").attr("r", function(d) {
        return d.radius;
      }).style("fill", 'white').style("stroke", '#555').style("stroke-width", 1.0);
      node.append("text").text(function(x) {
        return x.name;
      }).attr('class', 'label').attr('dy', '-.5em');
      node.append('text').text(function(x) {
        return x.documents;
      }).attr('class', 'documents').attr('dy', '.5em');
      node.on("mouseover", showDetails).on("mouseout", hideDetails);
      return node.exit().remove();
    };
    updateLinks = function() {
      link = linksG.selectAll("line.link").data(curLinksData, function(d) {
        return d.source.id + "_" + d.target.id;
      });
      link.enter().append("line").attr("class", "link").attr("stroke", "#ddd").attr("stroke-opacity", 0.8).attr("x1", function(d) {
        return d.source.x;
      }).attr("y1", function(d) {
        return d.source.y;
      }).attr("x2", function(d) {
        return d.target.x;
      }).attr("y2", function(d) {
        return d.target.y;
      });
      return link.exit().remove();
    };
    setFilter = function(newFilter) {
      var filterArray;
      filterArray = newFilter.split(' ').sort();
      return filter = filterArray.join('');
    };
    forceTick = function(e) {
      node.attr("transform", function(d, i) {
        return "translate(" + d.x + "," + d.y + ")";
      });
      return link.attr("x1", function(d) {
        return d.source.x;
      }).attr("y1", function(d) {
        return d.source.y;
      }).attr("x2", function(d) {
        return d.target.x;
      }).attr("y2", function(d) {
        return d.target.y;
      });
    };
    showDetails = function(d, i) {
      var curCirle;
      curCirle = d3.select(this).select('circle');
      return curCirle.style("stroke", "black").style("stroke-width", 2.0);
    };
    hideDetails = function(d, i) {
      return node.select('circle').style("stroke", "#555").style("stroke-width", 1.0);
    };
    return network;
  };

  $(function() {
    var myNetwork;
    myNetwork = Network();
    d3.json("network.json", function(json) {
      return myNetwork("#vis", json);
    });
    return $('#searchButton').click(function() {
      var newFilter;
      newFilter = $('#searchText').val();
      return myNetwork.toggleFilter(newFilter);
    });
  });

}).call(this);
