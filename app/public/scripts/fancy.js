(function() {
  var KEY_HISTORY, KEY_UNSYNCED, Network, getHistoryDataFromSessionStorage, getHistoryFromServer, manageHistory, printBreadcrumb, printHistory, printResultList, printToHistoryListItem, saveNavigationActionToSessionStorage, saveNavigationToHistory, sendToServer, sendUnsyncedToServer, setHistoryDataToSessionStorage;

  printBreadcrumb = function(focusedConceptInOrderAsListofList) {
    var br, concept, conceptString, i, j, lastIndex, len, ref, terms;
    br = $('.breadcrumb');
    br.text('');
    br.append("<li><a terms='[[]]'><i class='glyphicon glyphicon-home'/></a></li>");
    lastIndex = focusedConceptInOrderAsListofList.length - 1;
    if (lastIndex) {
      ref = focusedConceptInOrderAsListofList.slice(0, +(lastIndex - 1) + 1 || 9e9);
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        concept = ref[i];
        terms = JSON.stringify(focusedConceptInOrderAsListofList.slice(0, +i + 1 || 9e9));
        conceptString = concept.join(' ');
        br.append("<li><a terms='" + terms + "'>" + conceptString + "</a></li>");
      }
    }
    conceptString = focusedConceptInOrderAsListofList[lastIndex].join(' ');
    return br.append("<li>" + conceptString + "</li>");
  };

  $(function() {
    var adaptHeight, myNetwork, newUrl;
    manageHistory();
    adaptHeight = $(window).height() - $('#search-bar').outerHeight(true) - $('header').outerHeight(true) - 10;
    $('.col-md-6, #viz').height(adaptHeight);
    myNetwork = Network();
    newUrl = window.location.pathname + "/start";
    return d3.json(newUrl, function(json) {
      var searchSubmit;
      $('#vis').empty();
      console.log(json);
      myNetwork(json);
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
      $('#collapseTwo').on('hidden.bs.collapse', function() {
        return $('#collapseOne').collapse('show');
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
        }).on('typeahead:selected', function(e, data) {
          return searchSubmit();
        });
      });
    });
  });

  this.getCurrentConceptTerms = function(focusedConceptInOrderAsListofList) {
    return focusedConceptInOrderAsListofList.reduce(function(a, b) {
      return a.concat(b);
    });
  };

  this.userLoggedIn = function() {
    return $('#logout').length > 0;
  };

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
      return $('#history .list-group').prepend("<a class='list-group-item'> <span class='historyQuery' terms=" + data + ">" + terms + "</span></a>");
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

  manageHistory = function() {
    if (Modernizr.sessionstorage) {
      if (userLoggedIn()) {
        if (sessionStorage.getItem(KEY_UNSYNCED)) {
          return sendUnsyncedToServer();
        } else {
          return getHistoryFromServer();
        }
      } else {
        return printHistory();
      }
    }
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

  this.sendLinkclickToServer = function(url) {
    if (userLoggedIn()) {
      return $.post('/linkclick', {
        url: url
      });
    }
  };

  printResultList = function(curConcept, documents) {
    var button, details, doc, docId, j, la, len, nDocs, reg, resultingDocuments, results;
    $('#history').scrollTop();
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
        button = "<button class='btn pull-right' onclick='sendLikeToServer(\"" + doc.url + "\" ,\"" + doc.title + "\", this);'> <span class='glyphicon glyphicon-heart'></span></button>";
        reg = curConcept.intensionNames.join('|');
        la = doc.content.replace(new RegExp(reg, "gi"), '<strong>$&</strong>');
        results.push(details.append("<li class='list-group-item'><a onclick='sendLinkclickToServer(\"" + doc.url + "\"); return true;' href='" + doc.url + "' target='_blank'><h4 class='list-group-item-heading'>" + doc.title + "</h4></a><p class='list-group-item-text'>" + la + "</p>" + button + "<div class='clearfix'/></li>"));
      }
      return results;
    } else {
      return details.append("<div class='text-center' <br><br> No results.<br><br></div> ");
    }
  };

  Network = function() {
    var clickFunction, collide, collisionPadding, curNodesData, focus, focusedConceptInOrderAsListofList, fontScale, force, forceTick, formatLabelText, gravity, height, hideDetails, jitter, maxFontSize, maxRadius, minCollisionRadius, minFontSize, minRadius, network, node, nodesG, radiusScale, selection, showDetails, update, updateNodes, width, zoomed;
    selection = "#vis";
    width = parseInt(d3.select(selection).style("width"));
    height = parseInt(d3.select(selection).style("height"));
    jitter = 0.5;
    collisionPadding = 10;
    minCollisionRadius = 20;
    minRadius = 10;
    maxRadius = 100;
    minFontSize = 1;
    maxFontSize = 5;
    radiusScale = null;
    fontScale = null;
    curNodesData = [];
    focus = null;
    nodesG = null;
    node = null;
    focusedConceptInOrderAsListofList = [[]];
    force = d3.layout.force();
    network = function(startData) {
      var maxDocuments, vis, zoom;
      maxDocuments = startData.maxDocuments;
      focus = startData.concept;
      radiusScale = d3.scale.log().range([minRadius, maxRadius]).domain([1, maxDocuments]);
      fontScale = d3.scale.sqrt().range([minFontSize, maxFontSize]).domain([1, maxDocuments]);
      vis = d3.select(selection).append("svg").attr("width", width).attr("height", height);
      nodesG = vis.append("g").attr("id", "nodes");
      zoom = d3.behavior.zoom().on("zoom", zoomed);
      vis.call(zoom);
      force.on("tick", forceTick).size([width, height]).gravity(0).charge(0);
      return update();
    };
    update = function() {
      var focusedConceptFlatList;
      curNodesData = focus.children;
      curNodesData.forEach(function(node) {
        return node.forceR = Math.max(minCollisionRadius, radiusScale(node.extent.length));
      });
      force.nodes(curNodesData);
      updateNodes();
      force.start();
      focusedConceptFlatList = getCurrentConceptTerms(focusedConceptInOrderAsListofList);
      printResultList(curConcept, documents);
      $('.typeahead').typeahead('val', focusedConceptFlatList.join(' '));
      printBreadcrumb(focusedConceptInOrderAsListofList);
      if (curConcept.parentNames.length) {
        return $('header .row h4').remove();
      }
    };
    network.navigationClick = function(newConcept) {
      var newConceptTerms;
      force.stop();
      newConceptTerms = newConcept.split(',');
      if (focusedConceptInOrderAsListofList[0].length === 0) {
        focusedConceptInOrderAsListofList = [newConceptTerms];
      } else {
        focusedConceptInOrderAsListofList.push(newConceptTerms);
      }
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
      var c, w, x;
      force.stop();
      focusedConceptInOrderAsListofList = (function() {
        var j, len, ref, results;
        ref = query.split(' ');
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          w = ref[j];
          results.push([w.toLowerCase()]);
        }
        return results;
      })();
      x = ((function() {
        var j, len, ref, results;
        ref = query.split(' ');
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          w = ref[j];
          results.push([w.toLowerCase()]);
        }
        return results;
      })()).sort();
      if (!conceptToId.has(x)) {
        focusedConceptInOrderAsListofList = [[]];
        $('header .row').append('<h4><span class="label label-danger">No results. Showing Overview.</span></h4>');
      } else {
        c = conceptToId.get(x);
        if (c.parentNames.length) {
          saveNavigationToHistory(focusedConceptInOrderAsListofList, 'search');
        } else {
          focusedConceptInOrderAsListofList = [[]];
        }
      }
      return update();
    };
    formatLabelText = function(node) {
      var focusedNodeText, lowerdNodeText, w;
      lowerdNodeText = (function() {
        var j, len, ref, results;
        ref = node.intent;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          w = ref[j];
          results.push(w.toLowerCase());
        }
        return results;
      })();
      focusedNodeText = getCurrentConceptTerms(focusedConceptInOrderAsListofList);
      return lowerdNodeText.filter(function(x) {
        return focusedNodeText.indexOf(x) < 0;
      });
    };
    updateNodes = function() {
      node = nodesG.selectAll("g.node").data(curNodesData, function(d) {
        return d._id;
      });
      node.enter().append('g').attr('class', 'node').call(force.drag);
      node.selectAll("*").remove();
      node.append("circle").attr("r", function(d) {
        return radiusScale(d.extent.length);
      }).style("stroke", '#dfdfdf').style("stroke-width", 2).style("fill", "white");
      node.append("text").text(formatLabelText).attr("class", "nodeLabel").style("font-size", function(x) {
        return (fontScale(x.extent.length)) + "em";
      }).attr("dy", "0.25em");
      node.append("text").text(function(x) {
        return x.extent.length;
      }).attr("class", "countLabel").attr("dy", "1.5em");
      node.on("mouseover", showDetails).on("mouseout", hideDetails).on("click", clickFunction);
      return node.exit().remove();
    };
    showDetails = function(d, i) {
      d3.select(this).select('circle').style("stroke-width", 4.0);
      return d3.select(this).select('.countLabel').style("display", "inline");
    };
    hideDetails = function(d, i) {
      d3.select(this).select('circle').style("stroke-width", 2.0);
      return d3.select(this).select('.countLabel').style("display", "none");
    };
    clickFunction = function(d, i) {
      var x;
      x = d3.select(this).select('text').text();
      return network.navigationClick(x);
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
    return network;
  };

}).call(this);
