(function() {
  var Network;

  Network = function() {
    var allData, circleRadius, conceptToId, curConcept, curLinksData, curNodesData, filterLinks, filterNodes, force, forceTick, height, hideDetails, link, linkedByIndex, linksG, navigateNewConcept, neighboring, network, node, nodesG, nodesMap, setCurConcept, setupData, showDetails, update, updateLinks, updateNodes, width;
    width = 700;
    height = 500;
    circleRadius = 20;
    allData = [];
    curLinksData = [];
    curNodesData = [];
    linkedByIndex = {};
    conceptToId = null;
    nodesMap = null;
    nodesG = null;
    linksG = null;
    node = null;
    link = null;
    curConcept = null;
    force = d3.layout.force();
    network = function(selection, data) {
      var vis;
      allData = setupData(data);
      vis = d3.select(selection).append("svg").attr("width", width).attr("height", height);
      linksG = vis.append("g").attr("id", "links");
      nodesG = vis.append("g").attr("id", "nodes");
      force.size([width, height]);
      force.on("tick", forceTick).charge(-1000).linkDistance(100);
      return update();
    };
    update = function() {
      curNodesData = filterNodes(allData.nodes);
      curLinksData = filterLinks(allData.links, curNodesData);
      force.nodes(curNodesData);
      updateNodes();
      force.links(curLinksData);
      updateLinks();
      force.start();
      if (curConcept) {
        return $('#details').text('').append("<h3>" + curConcept.name + '</h3>').append(curConcept.documents);
      }
    };
    network.toggleFilter = function(newFilter) {
      force.stop();
      setCurConcept(newFilter);
      return update();
    };
    setupData = function(data) {
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
        return linkedByIndex[l.source.id + "," + l.target.id] = 1;
      });
      return data;
    };
    neighboring = function(a, b) {
      return linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id];
    };
    filterNodes = function(allNodes) {
      var filterdNodes;
      filterdNodes = [];
      if (curConcept) {
        filterdNodes.push(curConcept);
        filterdNodes = filterdNodes.concat(allNodes.filter(function(x) {
          return neighboring(curConcept, x);
        }));
      }
      return filterdNodes;
    };
    filterLinks = function(allLinks, curNodes) {
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
      node.on("mouseover", showDetails).on("mouseout", hideDetails).on("click", navigateNewConcept);
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
    setCurConcept = function(newConcept) {
      var conceptProccessed;
      conceptProccessed = newConcept.split(' ').sort().join();
      return curConcept = conceptToId.get(conceptProccessed);
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
      return d3.select(this).select('circle').style("stroke-width", 2.0);
    };
    hideDetails = function(d, i) {
      return node.select('circle').style("stroke-width", 1.0);
    };
    navigateNewConcept = function(d, i) {
      return network.toggleFilter(d.name);
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
