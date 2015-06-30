(function() {
  var KEY_HISTORY, KEY_UNSYNCED, getHistoryDataFromSessionStorage, getHistoryFromServer, printHistory, printResultList, printToHistoryListItem, saveNavigationActionToSessionStorage, saveNavigationToHistory, sendToServer, sendUnsyncedToServer, setHistoryDataToSessionStorage, userLoggedIn;

  userLoggedIn = function() {
    return $('#userName').length > 0;
  };

  $(function() {
    var adaptHeight, myNetwork;
    if (Modernizr.sessionstorage) {
      if (userLoggedIn()) {
        if (sessionStorage.getItem(KEY_UNSYNCED)) {
          sendUnsyncedToServer();
        } else {
          getHistoryFromServer();
        }
      } else {
        printHistory();
      }
    }
    adaptHeight = $(window).height() - $('#search-bar').outerHeight(true) - $('header').outerHeight(true) - 10;
    $('.col-md-6, #viz').height(adaptHeight);
    myNetwork = Network();
    d3.json("data/lattice.json", function(json) {
      var searchSubmit;
      myNetwork("#vis", json);
      searchSubmit = function() {
        var query;
        query = $('#searchText').val();
        $('input').blur();
        return myNetwork.navigationSearch(query);
      };
      $('#searchButton').click(function() {
        return searchSubmit();
      });
      $('#searchText').keypress(function(e) {
        if (e.which === 13) {
          searchSubmit();
          return false;
        }
      });
      $('#history').on('click', '.list-group-item', function() {
        var data, text;
        text = $(this).find('.historyQuery').attr('terms');
        data = JSON.parse(text);
        return myNetwork.navigationHistory(data);
      });
      $('.breadcrumb').on('click', 'a', function() {
        var data, text;
        text = $(this).attr('terms');
        data = JSON.parse(text);
        return myNetwork.navigationBreadcrumb(data);
      });
      $('#collapseOne').on('hidden.bs.collapse', function() {
        return $('#collapseTwo').collapse('show');
      });
      return $('#collapseTwo').on('hidden.bs.collapse', function() {
        return $('#collapseOne').collapse('show');
      });
    });
    return $.getJSON('data/suggestions.json', function(suggestions) {
      var substringMatcher;
      substringMatcher = function(strs) {
        return function(q, cb) {
          var matches, substrRegex;
          if (q) {
            matches = [];
            substrRegex = new RegExp("^" + q, 'i');
            $.each(strs, function(i, str) {
              if (substrRegex.test(str)) {
                return matches.push(str);
              }
            });
            return cb(matches);
          } else {
            return cb(strs.slice(0, 21));
          }
        };
      };
      return $('.typeahead').typeahead({
        highlight: true,
        minLength: 0
      }, {
        name: 'suggestions',
        source: substringMatcher(suggestions),
        limit: 20
      });
    });
  });

  KEY_HISTORY = "history";

  KEY_UNSYNCED = "unsynced";

  getHistoryDataFromSessionStorage = function(key) {
    var dataRaw;
    if (Modernizr.sessionstorage) {
      dataRaw = sessionStorage.getItem(key);
      if (dataRaw) {
        return JSON.parse(dataRaw);
      } else {
        return null;
      }
    }
  };

  setHistoryDataToSessionStorage = function(dataRaw, key) {
    var historyAsString;
    if (Modernizr.sessionstorage) {
      historyAsString = JSON.stringify(dataRaw);
      return sessionStorage.setItem(key, historyAsString);
    }
  };

  saveNavigationActionToSessionStorage = function(historyItem, key) {
    var history;
    history = getHistoryDataFromSessionStorage(key);
    if (!history) {
      history = [];
    }
    history.push(historyItem);
    return setHistoryDataToSessionStorage(history, key);
  };

  saveNavigationToHistory = function(data, interaction) {
    var historyItem;
    historyItem = {
      'terms': data,
      'interaction': interaction
    };
    printToHistoryListItem(historyItem);
    if (userLoggedIn()) {
      saveNavigationActionToSessionStorage(historyItem, KEY_HISTORY);
      return sendToServer(historyItem);
    } else {
      return saveNavigationActionToSessionStorage(historyItem, KEY_UNSYNCED);
    }
  };

  printHistory = function() {
    var history, historyItem, j, key, len, results;
    if (userLoggedIn()) {
      key = KEY_HISTORY;
    } else {
      key = KEY_UNSYNCED;
    }
    history = getHistoryDataFromSessionStorage(key);
    if (history) {
      results = [];
      for (j = 0, len = history.length; j < len; j++) {
        historyItem = history[j];
        results.push(printToHistoryListItem(historyItem));
      }
      return results;
    }
  };

  printToHistoryListItem = function(historyItem) {
    var data, items, terms, w;
    items = historyItem['terms'];
    if (items && items.length > 0 && items[0].length > 0) {
      data = JSON.stringify(items);
      terms = ((function() {
        var j, len, results;
        results = [];
        for (j = 0, len = items.length; j < len; j++) {
          w = items[j];
          results.push(w.join(' '));
        }
        return results;
      })()).join(' / ');
      return $('#history .list-group').prepend("<a href='#' class='list-group-item'> <span class='historyQuery' terms=" + data + ">" + terms + "</span></a>");
    }
  };

  sendToServer = function(historyItem) {
    return $.post('/history', {
      history: JSON.stringify([historyItem])
    });
  };

  sendUnsyncedToServer = function() {
    var history;
    history = getHistoryDataFromSessionStorage(KEY_UNSYNCED);
    if (history) {
      return $.post('/history', {
        history: JSON.stringify(history)
      }, function() {
        console.log('synced history to server');
        sessionStorage.removeItem(KEY_UNSYNCED);
        return getHistoryFromServer();
      });
    }
  };

  getHistoryFromServer = function() {
    return $.getJSON('/history', function(items) {
      var item, result;
      result = (function() {
        var j, len, results;
        results = [];
        for (j = 0, len = items.length; j < len; j++) {
          item = items[j];
          results.push({
            terms: JSON.parse(item.terms),
            interaction: item.interaction
          });
        }
        return results;
      })();
      setHistoryDataToSessionStorage(result, KEY_HISTORY);
      return printHistory();
    });
  };

  this.sendLikeToServer = function(url, title, element) {
    return $.post('/likes', {
      documentURL: url,
      documentTitle: title
    }).done(function() {
      return element.style.color = "FireBrick";
    }).fail(function(err) {
      alert('You have to be logged in to save documents.');
      return console.log(err);
    });
  };

  printResultList = function(curConcept, documents) {
    var button, details, doc, docId, j, len, nDocs, resultingDocuments, results, url;
    details = $('#details .list-group').text('');
    resultingDocuments = curConcept.extensionNames;
    nDocs = resultingDocuments.length;
    $('#numResults').text(nDocs);
    if (nDocs > 0) {
      resultingDocuments = resultingDocuments.slice(0, 101);
      results = [];
      for (j = 0, len = resultingDocuments.length; j < len; j++) {
        docId = resultingDocuments[j];
        doc = documents.get(docId);
        url = "http://www.mcu.es/ccbae/es/consulta/resultados_busqueda.cmd?tipo_busqueda=mapas_planos_dibujos&posicion=1&forma=ficha&id=" + docId;
        button = "<button class='btn pull-right' data-toggle='tooltip' data-placement='left' title='Bookmark this document. Requieres login.' onclick='sendLikeToServer(\"" + url + "\" ,\"" + doc.title + "\", this);'> <span class='glyphicon glyphicon-heart'></span></button>";
        results.push(details.append("<li class='list-group-item'><a href='" + url + "' target='_blank'><h4 class='list-group-item-heading'>" + doc.title + "</h4></a><p class='list-group-item-text'>" + doc.content + "</p>" + button + "<div class='clearfix'/></li>"));
      }
      return results;
    } else {
      return details.append("<div class='text-center' <br><br> No results.<br><br></div> ");
    }
  };

  this.Network = function() {
    var allNodes, clickFunction, collide, collisionPadding, conceptToId, createLabels, curConcept, curLinksData, curNodesData, documents, filterNodes, focusedConceptInOrderAsListofList, fontScale, force, forceTick, formatLabelText, gravity, height, hideDetails, idToConcept, jitter, linkedByIndex, maxRadius, minCollisionRadius, minRadius, network, node, nodesG, radiusScale, setupData, showDetails, update, updateNodes, whatIsInXButNotInY, width, zoomed;
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
    focusedConceptInOrderAsListofList = [];
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
      var br, c, concept, conceptProccessed, conceptString, focusedConceptFlatList, i, j, lastIndex, len, ref, terms;
      if (focusedConceptInOrderAsListofList.length > 0) {
        terms = getCurrentConceptTerms(focusedConceptInOrderAsListofList);
        conceptProccessed = ((function() {
          var j, len, results;
          results = [];
          for (j = 0, len = terms.length; j < len; j++) {
            c = terms[j];
            results.push(c.toLowerCase());
          }
          return results;
        })()).sort();
        curConcept = conceptToId.get(conceptProccessed);
      }
      curNodesData = filterNodes(allNodes);
      force.nodes(curNodesData);
      updateNodes();
      force.start();
      if (curConcept) {
        console.log('xx');
        console.log(focusedConceptInOrderAsListofList);
        focusedConceptFlatList = getCurrentConceptTerms(focusedConceptInOrderAsListofList);
        printResultList(curConcept, documents);
        $('#search-bar input').val(focusedConceptFlatList.join(' '));
        br = $('.breadcrumb');
        br.text('');
        br.append("<li><a href='#' terms='[[]]'><i class='glyphicon glyphicon-home'/></a></li>");
        lastIndex = focusedConceptInOrderAsListofList.length - 1;
        if (lastIndex) {
          ref = focusedConceptInOrderAsListofList.slice(0, +(lastIndex - 1) + 1 || 9e9);
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            concept = ref[i];
            terms = JSON.stringify(focusedConceptInOrderAsListofList.slice(0, +i + 1 || 9e9));
            conceptString = concept.join(' ');
            console.log(conceptString);
            br.append("<li><a href='#' terms='" + terms + "'>" + conceptString + "</a></li>");
          }
        }
        conceptString = focusedConceptInOrderAsListofList[lastIndex].join(' ');
        return br.append("<li>" + conceptString + "</li>");
      }
    };
    network.navigationClick = function(newConcept) {
      var newConceptTerms;
      force.stop();
      newConceptTerms = newConcept.split(',');
      focusedConceptInOrderAsListofList.push(newConceptTerms);
      saveNavigationToHistory(focusedConceptInOrderAsListofList, 'click');
      return update();
    };
    network.navigationBreadcrumb = function(data) {
      force.stop();
      focusedConceptInOrderAsListofList = data;
      saveNavigationToHistory(focusedConceptInOrderAsListofList, 'breadcrumb');
      return update();
    };
    network.navigationHistory = function(data) {
      force.stop();
      focusedConceptInOrderAsListofList = data;
      saveNavigationToHistory(focusedConceptInOrderAsListofList, 'history');
      return update();
    };
    network.navigationSearch = function(query) {
      var w;
      force.stop();
      focusedConceptInOrderAsListofList = (function() {
        var j, len, ref, results;
        ref = query.split(' ');
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          w = ref[j];
          results.push([w]);
        }
        return results;
      })();
      saveNavigationToHistory(focusedConceptInOrderAsListofList, 'search');
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
        filterdNodes = filterdNodes.filter(function(x) {
          return x.extensionNames.length > 0;
        });
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
      node.on("mouseover", showDetails).on("mouseout", hideDetails).on("click", clickFunction);
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
    clickFunction = function(d, i) {
      var x;
      x = d3.select(this).select('text').text();
      console.log(x);
      console.log(d);
      console.log(i);
      return network.navigationClick(x);
    };
    whatIsInXButNotInY = function(x, y) {
      return x.filter(function(z) {
        return y.indexOf(z) < 0;
      });
    };
    this.getCurrentConceptTerms = function(focusedConceptInOrderAsListofList) {
      console.log(focusedConceptInOrderAsListofList);
      return focusedConceptInOrderAsListofList.reduce(function(a, b) {
        return a.concat(b);
      });
    };
    return network;
  };

}).call(this);
