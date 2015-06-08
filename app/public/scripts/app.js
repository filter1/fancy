(function() {
  var Network, adaptQueryRepresentation, whatIsInXButNotInY,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $(function() {
    var adaptHeight, myNetwork, searchSubmit;
    adaptHeight = $(window).height() - $('#search-bar').outerHeight(true);
    $('.col-md-6, #viz').height(adaptHeight);
    myNetwork = Network();
    d3.json("lattice.json", function(json) {
      return myNetwork("#vis", json);
    });
    searchSubmit = function() {
      var newConcept;
      newConcept = $('#searchText').val().split(' ');
      return myNetwork.applyNewConceptToNetwork(newConcept);
    };
    $('#searchButton').click(function() {
      return searchSubmit();
    });
    return $('#searchText').keypress(function(e) {
      if (e.which === 13) {
        searchSubmit();
        return false;
      }
    });
  });

  Network = function() {
    var allNodes, collide, collisionPadding, conceptToId, createLabels, curConcept, curConceptAsListInOrderOfNavigation, curLinksData, curNodesData, documents, filterNodes, fontScale, force, forceTick, formatLabelText, gravity, height, hideDetails, idToConcept, jitter, linkedByIndex, maxRadius, minCollisionRadius, minRadius, navigateNewConcept, network, node, nodesG, printResultList, radiusScale, setupData, showDetails, update, updateNodes, width, zoomed;
    width = parseInt(d3.select("#vis").style("width"));
    height = parseInt(d3.select("#vis").style("height"));
    jitter = 0.5;
    collisionPadding = 10;
    minCollisionRadius = 20;
    minRadius = 10;
    maxRadius = 40;
    radiusScale = d3.scale.sqrt().range([minRadius, maxRadius]).domain([0, 100]);
    fontScale = d3.scale.linear().range([8, 16]).domain([0, 100]);
    allNodes = [];
    curLinksData = [];
    curNodesData = [];
    linkedByIndex = {};
    conceptToId = null;
    idToConcept = null;
    documents = null;
    nodesG = null;
    node = null;
    curConcept = null;
    curConceptAsListInOrderOfNavigation = null;
    force = d3.layout.force();
    network = function(selection, data) {
      var vis, zoom;
      setupData(data);
      vis = d3.select(selection).append("svg").attr("width", width).attr("height", height);
      nodesG = vis.append("g").attr("id", "nodes");
      zoom = d3.behavior.zoom().on("zoom", zoomed);
      vis.call(zoom);
      force.on("tick", forceTick).size([width, height]).gravity(0).charge(0);
      return update();
    };
    update = function() {
      curNodesData = filterNodes(allNodes);
      force.nodes(curNodesData);
      updateNodes();
      force.start();
      if (curConcept) {
        printResultList();
        return $('#search-bar input').val(curConceptAsListInOrderOfNavigation.join(' '));
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
    network.applyNewConceptToNetwork = function(newConceptList) {
      var c, conceptProccessed;
      force.stop();
      conceptProccessed = ((function() {
        var j, len, results;
        results = [];
        for (j = 0, len = newConceptList.length; j < len; j++) {
          c = newConceptList[j];
          results.push(c.toLowerCase());
        }
        return results;
      })()).sort();
      curConcept = conceptToId.get(conceptProccessed);
      adaptQueryRepresentation(curConceptAsListInOrderOfNavigation, newConceptList);
      return update();
    };
    setupData = function(data) {
      var nodes;
      nodes = data.lattice;
      nodes.forEach(function(n) {
        return n.radius = radiusScale(n.extensionNames.length);
      });
      nodes.forEach(function(d, i) {
        return d.forceR = Math.max(minCollisionRadius, radiusScale(d.extensionNames.length));
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
      return allNodes = nodes;
    };
    filterNodes = function(allNodes) {
      var filterdNodes;
      filterdNodes = [];
      if (curConcept) {
        filterdNodes = filterdNodes.concat(curConcept.childrenNames.map(function(x) {
          return idToConcept.get(x);
        }));
      }
      return filterdNodes;
    };
    createLabels = function(x, y) {
      return whatIsInXButNotInY(x, y);
    };
    formatLabelText = function(node) {
      var text;
      return text = createLabels(node.intensionNames, curConcept.intensionNames);
    };
    updateNodes = function() {
      node = nodesG.selectAll("g.node").data(curNodesData, function(d) {
        return d.id;
      });
      node.enter().append('g').attr('class', 'node').call(force.drag);
      node.selectAll("*").remove();
      node.append("circle").attr("r", function(d) {
        return d.radius;
      }).style("stroke", '#dfdfdf').style("stroke-width", 1).style("fill", "white");
      node.append("text").text(formatLabelText).attr("class", "nodeLabel").style("font-size", function(x) {
        return (fontScale(x.extensionNames.length)) + "px";
      });
      node.append("text").text(function(x) {
        return x.extensionNames.length;
      }).attr("class", "count").attr("dy", "1.1em");
      node.on("mouseover", showDetails).on("mouseout", hideDetails).on("click", navigateNewConcept);
      return node.exit().remove();
    };
    forceTick = function(e) {
      var dampenAlpha;
      dampenAlpha = e.alpha * 0.1;
      return node.each(gravity(dampenAlpha)).each(collide(jitter)).attr("transform", function(d, i) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    };
    gravity = function(alpha) {
      var ax, ay, cx, cy, ratio;
      cx = width / 2;
      cy = height / 2;
      ratio = height / width;
      ax = alpha * ratio;
      ay = alpha / ratio;
      return function(d) {
        d.x += (cx - d.x) * ax;
        return d.y += (cy - d.y) * ay;
      };
    };
    collide = function(jitter) {
      return function(d) {
        return curNodesData.forEach(function(d2) {
          var distance, minDistance, moveX, moveY, x, y;
          if (d !== d2) {
            x = d.x - d2.x;
            y = d.y - d2.y;
            distance = Math.sqrt(x * x + y * y);
            minDistance = d.forceR + d2.forceR + collisionPadding;
            if (distance < minDistance) {
              distance = (distance - minDistance) / distance * jitter;
              moveX = x * distance;
              moveY = y * distance;
              d.x -= moveX;
              d.y -= moveY;
              d2.x += moveX;
              return d2.y += moveY;
            }
          }
        });
      };
    };
    zoomed = function() {
      return nodesG.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    };
    showDetails = function(d, i) {
      d3.select(this).select('circle').style("stroke-width", 2.0).attr("r", function(d) {
        return String(d.radius + collisionPadding);
      });
      return d3.select(this).select('text').style("font-weight", "bold");
    };
    hideDetails = function(d, i) {
      node.select('circle').style("stroke-width", 1.0).attr("r", function(d) {
        return String(d.radius);
      });
      return node.select('text').style("font-weight", "normal");
    };
    navigateNewConcept = function(d, i) {
      return network.applyNewConceptToNetwork(d.intensionNames);
    };
    return network;
  };

  adaptQueryRepresentation = function(curConceptListInOrder, newConceptList) {
    var w, whatIsNew;
    if (curConceptListInOrder) {
      if (newConceptList.length >= curConceptListInOrder.length) {
        whatIsNew = whatIsInXButNotInY(newConceptList, curConceptListInOrder);
        if (whatIsNew.length === newConceptList.length) {
          return curConceptListInOrder = newConceptList;
        } else {
          return curConceptListInOrder = curConceptListInOrder.concat(whatIsNew);
        }
      } else {
        curConceptListInOrder = (function() {
          var j, len, results;
          results = [];
          for (j = 0, len = curConceptListInOrder.length; j < len; j++) {
            w = curConceptListInOrder[j];
            if (indexOf.call(newConceptList, w) >= 0) {
              results.push(w);
            }
          }
          return results;
        })();
        if (curConceptListInOrder.length === 0) {
          return curConceptListInOrder = newConceptList;
        }
      }
    } else {
      return curConceptListInOrder = newConceptList;
    }
  };

  whatIsInXButNotInY = function(x, y) {
    return x.filter(function(z) {
      return y.indexOf(z) < 0;
    });
  };

}).call(this);
