(function() {
  var Network;

  Network = function() {
    var allNodes, colorBy, conceptToId, curConcept, curLinksData, curNodesData, difArray, documents, filterLinks, filterNodes, force, forceTick, formatLabelText, height, hideDetails, idToConcept, link, linkedByIndex, linksG, navigateNewConcept, network, node, nodesG, printResultList, radiusScale, setCurConcept, setupData, showDetails, update, updateLinks, updateNodes, width;
    width = 500;
    height = 500;
    radiusScale = d3.scale.linear().range([20, 30]).domain([0, 200]);
    allNodes = [];
    curLinksData = [];
    curNodesData = [];
    linkedByIndex = {};
    conceptToId = null;
    idToConcept = null;
    documents = null;
    nodesG = null;
    linksG = null;
    node = null;
    link = null;
    curConcept = null;
    force = d3.layout.force();
    network = function(selection, data) {
      var vis;
      setupData(data);
      vis = d3.select(selection).append("svg").attr("width", width).attr("height", height);
      linksG = vis.append("g").attr("id", "links");
      nodesG = vis.append("g").attr("id", "nodes");
      force.size([width, height]);
      force.on("tick", forceTick).charge(-500).linkDistance(function(d) {
        return d.weight;
      }).size([width, height]);
      return update();
    };
    update = function() {
      var conceptName;
      curNodesData = filterNodes(allNodes);
      curLinksData = filterLinks(curNodesData);
      force.nodes(curNodesData);
      updateNodes();
      force.links(curLinksData);
      updateLinks();
      force.start();
      if (curConcept) {
        printResultList();
        conceptName = curConcept.intensionNames.join(' ');
        return $('#search-bar input').val(conceptName);
      }
    };
    printResultList = function() {
      var details, doc, docId, i, j, len, ref, reg;
      details = $('#details').text('').append(curConcept.extensionNames.length + " results<br>");
      i = 1;
      ref = curConcept.extensionNames;
      for (j = 0, len = ref.length; j < len; j++) {
        docId = ref[j];
        doc = documents.get(docId);
        details.append("<h4>" + i + ". " + doc.title + "</h4>").append("<p>" + doc.content + "</p>").append("<p>" + doc.notes + "</p>").append("<p>" + doc.references + "</p>").append("<p>" + doc.materia + "</p>").append("<p>" + doc.language + "</p>").append("<p>" + doc.nes + ", " + doc.nes_location + ", " + doc.nes_mis + ", " + doc.nes_organization + ", " + doc.nes_person + "</p>");
        i += 1;
      }
      reg = curConcept.intensionNames.join('|');
      return details.html(details.html().replace(new RegExp(reg, "gi"), '<strong>$&</strong>'));
    };
    network.toggleFilter = function(newFilter) {
      force.stop();
      setCurConcept(newFilter);
      return update();
    };
    setupData = function(data) {
      var nodes;
      nodes = data.lattice;
      nodes.forEach(function(n) {
        return n.radius = radiusScale(n.extensionNames.length);
      });
      idToConcept = d3.map(nodes, function(x) {
        return x.id;
      });
      conceptToId = d3.map(nodes, function(x) {
        return x.intensionNames.sort();
      });
      documents = d3.map(data.objects, function(x) {
        return x.id;
      });
      console.log(documents);
      return allNodes = nodes;
    };
    filterNodes = function(allNodes) {
      var filterdNodes;
      filterdNodes = [];
      if (curConcept) {
        filterdNodes.push(curConcept);
        filterdNodes = filterdNodes.concat(curConcept.parentNames.map(function(x) {
          return idToConcept.get(x);
        }));
        filterdNodes = filterdNodes.concat(curConcept.childrenNames.map(function(x) {
          return idToConcept.get(x);
        }));
      }
      return filterdNodes;
    };
    filterLinks = function(curNodes) {
      var curLinks, idToCurNodes, j, k, len, len1, n, pId, randomnumber, ref;
      curLinks = [];
      idToCurNodes = d3.map(curNodes, function(x) {
        return x.id;
      });
      for (j = 0, len = curNodes.length; j < len; j++) {
        n = curNodes[j];
        ref = n.childrenNames;
        for (k = 0, len1 = ref.length; k < len1; k++) {
          pId = ref[k];
          if (idToCurNodes.get(pId)) {
            curLinks.push({
              'source': idToConcept.get(n.id),
              'target': idToConcept.get(pId),
              'weight': randomnumber = Math.floor(Math.random() * height) / 2
            });
          }
        }
      }
      return curLinks;
    };
    difArray = function(x, y) {
      return x.filter(function(z) {
        return y.indexOf(z) < 0;
      });
    };
    formatLabelText = function(x, y) {
      if (x === y) {
        return x;
      }
      if (x.length > y.length) {
        return difArray(x, y);
      }
      return difArray(y, x);
    };
    colorBy = function(d) {
      if (d.intensionNames.length < curConcept.intensionNames.length) {
        return 'orange';
      }
      return 'white';
    };
    updateNodes = function() {
      node = nodesG.selectAll("g.xxx").data(curNodesData, function(d) {
        return d.id;
      });
      node.enter().append('g').attr('class', 'xxx').call(force.drag);
      node.append("circle").attr("class", "node").attr("r", function(d) {
        return d.radius;
      }).style("fill", colorBy).style("stroke", '#555').style("stroke-width", 1.0);
      node.append("text").text(function(x) {
        return formatLabelText(x.intensionNames, curConcept.intensionNames);
      }).attr('class', 'label');
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
      conceptProccessed = newConcept.sort();
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
      return network.toggleFilter(d.intensionNames);
    };
    return network;
  };

  $(function() {
    var myNetwork;
    myNetwork = Network();
    d3.json("lattice.json", function(json) {
      return myNetwork("#vis", json);
    });
    return $('#searchButton').click(function() {
      var newFilter;
      newFilter = $('#searchText').val().split(' ');
      return myNetwork.toggleFilter(newFilter);
    });
  });

}).call(this);
