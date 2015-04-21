(function() {
  var Network;

  Network = function() {
    var allData, circleRadius, conceptToId, curLinksData, curNodesData, filter, filterLinks, filterNodes, force, forceTick, height, hideDetails, link, linkedByIndex, linksG, neighboring, network, node, nodesG, setFilter, setupData, showDetails, update, updateLinks, updateNodes, width;
    width = 700;
    height = 500;
    circleRadius = 20;
    allData = [];
    curLinksData = [];
    curNodesData = [];
    linkedByIndex = {};
    conceptToId = null;
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
      nodesMap = d3.map(data.nodes, function(n) {
        return n.id;
      });
      conceptToId = d3.map(data.nodes, function(x) {
        return x.name;
      });
      data.links.forEach(function(l) {
        l.source = nodesMap.get(l.source);
        l.target = nodesMap.get(l.target);
        return linkedByIndex[l.source.id + ", " + l.target.id] = 1;
      });
      return data;
    };
    neighboring = function(a, b) {
      return linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id];
    };
    filterNodes = function(allNodes) {
      var filterdNodes, valueFromMap;
      filterdNodes = [];
      console.log(conceptToId);
      console.log(filter);
      valueFromMap = conceptToId.get(filter);
      console.log(valueFromMap);
      if (conceptToId.get(filter)) {
        filterdNodes.push(conceptToId.get(filter));
      }
      return filterdNodes;
    };
    filterLinks = function(allLinks, curNodes) {
      console.log(curNodes);
      curNodes = d3.map(curNodes, function(x) {
        return x.id;
      });
      return allLinks.filter(function(l) {
        return curNodes.get(l.source.id) && curNodes.get(l.target.id);
      });
    };
    updateNodes = function() {
      node = nodesG.selectAll("g.xxx").data(curNodesData, function(d) {
        return d.id;
      });
      node.enter().append('g').attr('class', 'xxx').call(force.drag);
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
      node.exit().remove();
      console.log(curNodesData);
      return console.log(node);
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
