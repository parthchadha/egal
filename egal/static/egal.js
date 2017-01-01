navBar = '\
<nav class="navbar navbar-light bg-faded"> \
  <ul class="nav navbar-nav contexts"> \
    <li class="nav-item dropdown">\
      <a class="nav-link dropdown-toggle" href="#" id="supportedContentDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Image</a>\
      <div class="dropdown-menu" aria-labelledby="supportedContentDropdown">\
        <a id="clear" class="dropdown-item" href="#">Clear</a>\
        <a id="save" class="dropdown-item" href="#">Save</a>\
      </div>\
    </li>\
    <li id="selectContext" class="nav-item active"> \
      <a class="nav-link" href="#">Select<span class="sr-only">(current)</span></a>\
    </li>\
    <li id="makeRect" class="nav-item">\
      <a class="nav-link" href="#">Rect</a>\
    </li>\
    <li id="makeCircle" class="nav-item">\
      <a class="nav-link" href="#">Circle</a>\
    </li>\
    <li id="makeLine" class="nav-item">\
      <a class="nav-link" href="#">Line</a>\
    </li>\
    <li id="makeConnect" class="nav-item">\
      <a class="nav-link" href="#">Connect</a>\
    </li>\
    <li id="makeText" class="nav-item">\
      <a class="nav-link" href="#">Text</a>\
    </li>\
    <li class="nav-item dropdown">\
      <a class="nav-link dropdown-toggle" href="#" id="supportedContentDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Order</a>\
      <div class="dropdown-menu" aria-labelledby="supportedContentDropdown">\
        <a id="toFront" class="dropdown-item" href="#">To Front</a>\
        <a id="toBack" class="dropdown-item" href="#">To Back</a>\
      </div>\
    </li>\
  </ul>\
  <form class="form-inline float-xs-right">\
    <div class="input-group">\
      <span class="input-group-addon" id="basic-addon1">Stroke</span>\
      <input id="stroke" style="width:80px" class="form-control" type="number" placeholder="12">\
    </div>\
    <div class="input-group">\
      <span class="input-group-addon" id="basic-addon1">Color</span>\
      <input id="color" style="width:100px" class="form-control" type="text" placeholder="red">\
    </div>\
    <div class="input-group">\
      <span class="input-group-addon" id="basic-addon1">Fill</span>\
      <input id="fill" style="width:100px" class="form-control" type="text" placeholder="red">\
    </div>\
  </form>\
</nav>';


function trimPX(string) {
    return string.substring(0, string.length - 2);
}

define(['jquery', './snap.svg'], function ($, snap) {

    // http://svg.dabbles.info/snaptut-freetransform-vb3.js
//view-source:https://viereck.ch/latex-to-svg/
//http://stackoverflow.com/questions/34924033/convert-latex-mathml-to-svg-or-image-with-mathjax-or-similar
    function Egal(container, drawName, options) {
        this.options = options;
        this.container = container;
        this.drawName = drawName;
        this.snap = null;
        this.drawing = container + ' div.drawing';
        this.svg = this.drawing + ' svg';
        this.menuSVG = container + ' div.menu svg';
        this.currentId = 0;
        var self = this;

        this.createNewId = function () {
            self.currentId += 1;
            return 'drup_elem_' + self.currentId;
        };

        console.log("Created Egal");

        this.makeCircle = new MakeCircleContext(this);
        this.makeRect = new MakeRectangleContext(this);
        this.selectionContext = new SelectionContext(this);
        this.textContext = new TextContext(this);
        // this.lineContext = new LineContext(this);
        this.connectContext = new ConnectContext(this);
        this.currentContext = this.selectionContext;

        function linkContextButton(selector, context) {
            $(selector + ' a').click(function () {
                self.currentContext = context;
                $('.contexts li').removeClass("active");
                $(selector).addClass("active");
            })
        }


        // $(self.container).append(menuDiv);
        $(self.container).append($(navBar));
        $(self.container).append("<div class='drawing'></div>");
        $(self.container).append("<div class='hidden' style=''></div>");

        linkContextButton('#makeRect', this.makeRect);
        linkContextButton('#makeCircle', this.makeCircle);
        // linkContextButton('#makeLine', this.lineContext);
        linkContextButton('#makeConnect', this.connectContext);
        linkContextButton('#makeText', this.textContext);
        linkContextButton('#selectContext', this.selectionContext);

        $("#toFront").click(function () {
            self.selectionContext.moveToFront();
        });
        $("#toBack").click(function () {
            self.selectionContext.moveToBack();
        });

        $("#clear").click(function () {
            $(self.svg).empty();
            $(self.drawing + ">div").remove();
            self.connectContext.clear();
            self.currentId = 0;

        });
        $("#save").click(function () {
            self.saveCurrentSVG();
        });

        $("#stroke").change(function () {
            self.selectionContext.currentSelection.select(".core").attr({strokeWidth: $('#stroke').val()})
        });

        $("#fill").change(function () {
            // var snapSelection = new Snap(self.selectionContext.currentSelection);
            console.log("New Color: " + $('#fill').val());
            self.selectionContext.currentSelection.select(".core").attr({fill: $('#fill').val()})
        });

        $("#color").change(function () {
            // var snapSelection = new Snap(self.selectionContext.currentSelection);
            self.selectionContext.currentSelection.select(".core").attr({stroke: $('#color').val()})
        });

        this.selectionContext.onSelect(function (snapElem) {
            core = snapElem.select(".core");
            console.log(snapElem.attr("fill"));
            $('#stroke').val(trimPX(core.attr("strokeWidth")));
            $('#fill').val(Snap.color(core.attr("fill")).hex);
            $('#color').val(Snap.color(core.attr("stroke")).hex);
        });


        this.activateElement = function (elem) {
            elem.click(function (e) {
                if (self.currentContext.onClickElement) self.currentContext.onClickElement(e, this);
            });
            elem.mousedown(function (e) {
                console.log("MouseDown!");
                if (self.currentContext.onMouseDownElement) self.currentContext.onMouseDownElement(e, this);
            });
            elem.mouseover(function (e) {
                if (self.currentContext.onMouseOver) self.currentContext.onMouseOver(e, this);
            });
            elem.selectAll(".endPoint").forEach(function (endPoint) {
                endPoint.drag(
                    function (dx, dy, x, y, event) {
                        if (self.currentContext.onDragEndPoint) self.currentContext.onDragEndPoint(dx, dy, x, y, event, this);
                    },
                    function (x, y, event) {
                        if (self.currentContext.onDragEndPointStart) self.currentContext.onDragEndPointStart(x, y, event, this);
                    },
                    function (x, y, event) {
                        if (self.currentContext.onDragEndPointEnd) self.currentContext.onDragEndPointEnd(x, y, event, this);
                    }
                );
                endPoint.click(function (event) {
                    if (self.currentContext.onClickEndPoint) self.currentContext.onClickEndPoint(event, this);
                });
            });
            elem.selectAll(".core").forEach(function (core) {
                core.drag(
                    function (dx, dy, x, y, event) {
                        if (self.currentContext.onDragCore) self.currentContext.onDragCore(dx, dy, x, y, event, this);
                    },
                    function (x, y, event) {
                        if (self.currentContext.onDragCoreStart) self.currentContext.onDragCoreStart(x, y, event, this);
                    },
                    function (x, y, event) {
                        if (self.currentContext.onDragCoreEnd) self.currentContext.onDragCoreEnd(x, y, event, this);
                    }
                );
                core.click(function (e) {
                    if (self.currentContext.onClickCore) self.currentContext.onClickCore(e, this);
                });
            })

        };

        this.registerElement = function (elem) {
            elem.attr({id: self.createNewId()}).addClass("drupElem");
            elem.selectAll(".endPoint").forEach(function (endPoint, index) {
                endPoint.attr({id: elem.attr("id") + "_endpoint_" + index})
            });
            this.activateElement(elem);

        };

        $.get('/draw/' + self.drawName, function (data, status) {
            $(self.drawing).html(data);
            $(self.svg).attr("height", self.options.height || 600);
            $(self.svg).attr("width", self.options.width || 400);
            self.snap = Snap($(self.svg).get(0));
            self.filter = self.snap.filter(Snap.filter.shadow(0, 2, 3));

            // self.activateElement($(self.svg).find("*"));
            var elements = self.snap.selectAll(".drupElem");
            console.log(elements);
            elements.forEach(function (elem) {
                self.activateElement(new Snap(elem));
            });

            self.currentId = elements.length;
            // $(self.svg).find("*").click(function (e) {
            //     if (self.currentContext.onClickElement) self.currentContext.onClickElement(e, this);
            // });
            self.snap.click(function (e) {
                if (self.currentContext.onClick) self.currentContext.onClick(e, this);
            });
            self.snap.mousemove(function (e) {
                if (self.currentContext.onMouseMove) self.currentContext.onMouseMove(e, this);
            });
            self.snap.mouseout(function (e) {
                if (self.currentContext.onMouseOut) self.currentContext.onMouseOut(e, this);
            });
            self.snap.mousedown(function (e) {
                if (self.currentContext.onMouseDown) self.currentContext.onMouseDown(e, this);
            });
            self.snap.mouseup(function (e) {
                if (self.currentContext.onMouseUp) self.currentContext.onMouseUp(e, this);
            });

            self.connectContext.loadConnectors();
            console.log("Set SVG");
            // MathJax.Hub.Queue(["Typeset", MathJax.Hub, self.svg])

        });


        this.saveCurrentSVG = function () {
            self.connectContext.saveConnectors();
            var cloned = $(self.drawing).clone();
            cloned.find(".transient").remove();
            $.ajax({
                type: 'POST',
                url: '/draw/' + drawName,
                data: cloned.html(),
                contentType: "text/xml",
                dataType: "text",
                success: function (data, status) {
                    console.log(data);
                }
            });
        };

    }

    function MakeCircleContext(drupyter) {
        this.drupyter = drupyter;
        var self = this;
        var centerX = -1;
        var centerY = -1;
        var circle = null;

        this.onClick = function (e, element) {
            if (circle) {
                console.log(circle.attr('cx'));
                var cx = Number(circle.attr('cx'));
                var cy = Number(circle.attr('cy'));
                var radius = Number(circle.attr('r'));
                var attr = {stroke: "#000", strokeWidth: 1, fill: '#fff', opacity: 0.0}; //fillOpacity: 0
                circle.addClass("core");
                var group = drupyter.snap.group(circle);
                group.append(drupyter.snap.circle(cx, cy - radius, 5).attr(attr).addClass("endPoint up"));
                group.append(drupyter.snap.circle(cx, cy + radius, 5).attr(attr).addClass("endPoint down"));
                group.append(drupyter.snap.circle(cx - radius, cy, 5).attr(attr).addClass("endPoint left"));
                group.append(drupyter.snap.circle(cx + radius, cy, 5).attr(attr).addClass("endPoint right"));
                // var group = drupyter.snap.group(circle, upEndPoint, downEndPoint, leftEndPoint, rightEndPoint);
                console.log(group);
                drupyter.registerElement(group);
                drupyter.saveCurrentSVG();
                circle = null;

            } else {
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                centerX = x;
                centerY = y;
                circle = drupyter.snap.circle(x, y, 0).attr({"vector-effect": "non-scaling-stroke"});

                circle.attr({
                    fill: "#fff",
                    stroke: "#000",
                    strokeWidth: 1,
                });
                // var remembered = circle.node;
                // $(circle.node).click(function (e) {
                //     if (drupyter.currentContext.onClickElement) drupyter.currentContext.onClickElement(e, remembered);
                // });
            }
        };

        this.onMouseMove = function (e, element) {
            if (circle) {
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                circle.attr({
                    r: Math.max(Math.abs(centerX - x), Math.abs(centerY - y))
                })
            }
        };

        this.onClickElement = function (e, element) {
            console.log("Selected in MakeCircle Mode");
        }


    }

    function SelectionContext(drupyter) {

        this.currentSelection = null;
        var listeners = [];
        var moveListeners = [];
        var dragging = false;

        this.onSelect = function (listener) {
            listeners.push(listener)
        };

        this.onMove = function (listener) {
            moveListeners.push(listener)
        };

        this.onClickElement = function (e, element) {
            console.log("OnClick");
            this.selectElement(element);
            // if (currentSelection) {
            //     currentSelection = null
            // }
        };

        this.selectElement = function (elem) {
            // console.log(this.listeners);
            this.currentSelection = elem;
            $.each(listeners, function (index, value) {
                value(elem);
            });
        };

        this.onMouseOver = function (e, element) {
            if (!dragging) element.selectAll(".endPoint").forEach(function (endPoint) {
                endPoint.attr({opacity: 1.0})
            });
        };
        this.onMouseOut = function (e, element) {
            console.log("Out");
            console.log(dragging);
            if (!dragging) element.selectAll(".endPoint").forEach(function (endPoint) {
                endPoint.attr({opacity: 0.0})
            });
        };


        this.onDragEndPoint = function (dx, dy, x, y, event, endPoint) {
            var parent = endPoint.parent();
            var core = parent.select(".core");
            var x_distance = endPoint.data("cx") - core.getBBox().cx;
            var x_scale = (x_distance + dx) / x_distance; //need to be scaled down by current
            var y_distance = endPoint.data("cy") - core.getBBox().cy;
            var y_scale = (y_distance + dy) / y_distance;

            if (endPoint.hasClass("right") || endPoint.hasClass("left")) {
                y_scale = 1.0;
            } else if (endPoint.hasClass("up") || endPoint.hasClass("down")) {
                x_scale = 1.0
            }
            core.transform(core.data("orig_transform") + "S" + x_scale + "," + y_scale);
            parent.selectAll(".endPoint").forEach(function (ep) {
                var ep_dx = (x_scale - 1.0) * (ep.data("cx") - core.getBBox().cx);
                var ep_dy = (y_scale - 1.0) * (ep.data("cy") - core.getBBox().cy);
                ep.transform(ep.data("orig_transform") + "T" + ep_dx + "," + ep_dy);
                $.each(moveListeners, function (index, listener) {
                    listener(ep);
                });

            });
        };

        this.onDragEndPointStart = function (x, y, event, endPoint) {
            var parent = endPoint.parent();
            var core = parent.select(".core");
            core.data("orig_transform", core.transform().globalMatrix.toTransformString());
            parent.selectAll(".endPoint").forEach(function (ep) {
                ep.data("orig_transform", ep.transform().globalMatrix.toTransformString());
                ep.data("cx", ep.getBBox().cx);
                ep.data("cy", ep.getBBox().cy);
            });
            dragging = true;
        };

        this.onDragEndPointEnd = function (x, y, event, core) {
            dragging = false
        };

        this.onDragCore = function (dx, dy, x, y, event, core) {
            var parent = core.parent();
            core.transform(core.data("orig_transform") + "T" + dx + "," + dy);
            parent.selectAll(".endPoint").forEach(function (ep) {
                ep.transform(ep.data("orig_transform") + "T" + dx + "," + dy);
                $.each(moveListeners, function (index, listener) {
                    listener(ep);
                });
            });
            $.each(moveListeners, function (index, listener) {
                listener(core);
            });

            //             listener(self.currentSelection);
            //             //todo: this should also call the move/change listeners on all sub-elements
            //         });

        };
        this.onDragCoreStart = function (x, y, event, core) {
            var parent = core.parent();
            core.data("orig_transform", core.transform().globalMatrix.toTransformString());
            parent.selectAll(".endPoint").forEach(function (ep) {
                ep.data("orig_transform", ep.transform().globalMatrix.toTransformString());
            });
            dragging = true;
        };
        this.onDragCoreEnd = function (x, y, event, core) {
            // var parent = core.parent();
            // parent.selectAll(".endPoint").forEach(function (endPoint) {
            //     endPoint.attr({opacity: 0.0})
            // });
            dragging = false
        };


        // this.onMouseDownElement = function (e, element) {
        //     console.log("Clicked " + element);
        //     startX = e.pageX;
        //     startY = e.pageY;
        //     this.selectElement(element);
        //     var snapElement = new Snap(this.currentSelection);
        //     snapElement.attr({filter: drupyter.filter});
        //     oldMatrix = snapElement.attr("transform").localMatrix; //$(currentSelection).attr("transform");
        //     moving = true;
        //     // are we at the border of element?
        //     console.log("BBOX");
        //     console.log(snapElement);
        //     console.log(snapElement.getBBox());
        //
        // };

        this.moveToFront = function () {
            this.currentSelection.appendTo(this.currentSelection.paper);
        };

        this.moveToBack = function () {
            this.currentSelection.prependTo(this.currentSelection.paper);
        };

        // this.onMouseUp = function (e, element) {
        //     console.log("MouseUp");
        //     moving = false;
        //     new Snap(this.currentSelection).attr({filter: null});
        //     // currentSelection = null;
        // };

    }


    function ConnectContext(drupyter) {

        var line = null;

        this.onClick = function (e, element) {
            console.log("Paper clicked!");
            console.log(element);
            // if (line) {
            //     line = null;
            //     drupyter.saveCurrentSVG();
            // } else {
            //     var offset = $(element).offset();
            //     var x = e.pageX - offset.left;
            //     var y = e.pageY - offset.top;
            //     line = drupyter.snap.line(x, y, x, y).attr({
            //         stroke: '#00ADEF'
            //     });
            //     drupyter.registerElement(line);
            //     drupyter.selectionContext.selectElement(line.node);
            // }
        };

        // this.onClickElement = function (e, element) {
        //
        //     // console.log("Clicked " + element);
        // };

        drupyter.selectionContext.onMove(function (elem) {
            var bbox = elem.getBBox();
            // console.log("Moved " + elem);
            // console.log(elem.paper.selectAll("[data-n1='" + elem.attr("id") + "'"));

            elem.paper.selectAll("[data-n1='" + elem.attr("id") + "'").forEach(function (connector) {
                connector.attr({x1: bbox.cx, y1: bbox.cy})
            });
            elem.paper.selectAll("[data-n2='" + elem.attr("id") + "'").forEach(function (connector) {
                connector.attr({x2: bbox.cx, y2: bbox.cy})
            });

            // // line.attr({x2: bbox.cx, y2: bbox.cy})
            // var elemLine = elem2line[elem.id];
            // console.log(elemLine);
            // if (elemLine) {
            //     $.each(elemLine, function (index, elem) {
            //         if (elem.start) {
            //             elem.line.attr({x1: bbox.cx, y1: bbox.cy})
            //         } else {
            //             elem.line.attr({x2: bbox.cx, y2: bbox.cy})
            //         }
            //     })

        });

        this.onMouseOver = function (e, element) {
            element.selectAll(".endPoint").forEach(function (endPoint) {
                endPoint.attr({opacity: 1.0})
            });
        };
        this.onMouseOut = function (e, element) {
            console.log("Out");
            // console.log(dragging);
            element.selectAll(".endPoint").forEach(function (endPoint) {
                endPoint.attr({opacity: 0.0})
            });
        };


        this.onMouseMove = function (e, element) {
            if (line) {
                console.log("Changing ...");
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                // var dx = x - Number(line.attr("x1"))
                // var dy =
                line.attr({
                    x2: x,
                    y2: y
                })

            }
        };

        this.onClickEndPoint = function (event, endPoint) {
            console.log("Starting line at Endpoint");
            var bbox = endPoint.getBBox();
            if (!line) {
                line = drupyter.snap.line(bbox.cx, bbox.cy, bbox.cx, bbox.cy).attr({
                    stroke: '#000',
                }); //.addClass("transient");
                line.attr("data-n1", endPoint.attr("id"));
                line.prependTo(line.paper);
                // line.remove();
                // drupyter.snap.before(line);
            } else {
                line.attr({
                    x2: bbox.cx,
                    y2: bbox.cy
                });
                line.attr("data-n2", endPoint.attr("id"));

                line = null
            }
        };

        this.saveConnectors = function () {
        };

        this.loadConnectors = function () {
        };

        this.clear = function () {

        };


    }

    function OldConnectContext(drupyter) {

        var line = null;
        var connectors = [];
        var currentStart = null;
        var elem2line = {};

        drupyter.selectionContext.onMove(function (elem) {
            var bbox = new Snap(elem).getBBox();
            console.log("Moved " + elem);
            // line.attr({x2: bbox.cx, y2: bbox.cy})
            var elemLine = elem2line[elem.id];
            console.log(elemLine);
            if (elemLine) {
                $.each(elemLine, function (index, elem) {
                    if (elem.start) {
                        elem.line.attr({x1: bbox.cx, y1: bbox.cy})
                    } else {
                        elem.line.attr({x2: bbox.cx, y2: bbox.cy})
                    }
                })
            }
        });

        this.clear = function () {
            connectors = [];
            elem2line = {};
        };


        this.saveConnectors = function () {
            var currentConnectors = $(drupyter.drawing).children(".connector");
            console.log(currentConnectors);
            if (currentConnectors) {
                currentConnectors.remove();
            }
            $.each(connectors, function (index, connector) {
                $(drupyter.drawing).append($("<div>", {class: "connector", n1: connector.n1, n2: connector.n2}));
            })
        };

        this.loadConnectors = function () {
            var connectors = $(drupyter.drawing).children(".connector");
            connectors.each(function (i, elem) {
                console.log(elem);
                console.log(typeof(elem));
                console.log($(elem));
                //    todo: set up line
                //     var line = drupyter.snap.line({})
                let id1 = elem.getAttribute("n1");
                let id2 = elem.getAttribute("n2");
                var n1 = drupyter.snap.select('#' + id1);
                var n2 = drupyter.snap.select('#' + id2);
                var b1 = n1.getBBox();
                var b2 = n2.getBBox();
                var line = drupyter.snap.line({
                    x1: b1.cx,
                    y1: b1.cy,
                    x2: b2.cx,
                    y2: b2.cy
                }).attr({stroke: '#000'}).addClass("transient").prependTo(drupyter.snap);
                if (!elem2line[id1]) elem2line[id1] = [];
                if (!elem2line[id2]) elem2line[id2] = [];
                elem2line[id1].push({line: line, start: true});
                elem2line[id2].push({line: line, start: false});
                connectors.push({n1: id1, n2: id2});
            });
        };


        this.onClickElement = function (e, element) {
            var id = $(element).attr('id');
            var bbox = new Snap(element).getBBox();
            if (currentStart == null) {
                currentStart = id;
                line = drupyter.snap.line(bbox.cx, bbox.cy, bbox.cx, bbox.cy).attr({
                    stroke: '#000',
                }).addClass("transient");
                line.prependTo(drupyter.snap);
                console.log("Clicked start: " + id);
                if (!elem2line[id]) elem2line[id] = [];
                elem2line[id].push({line: line, start: true});
            } else {
                console.log("Clicked end: " + id);
                line.attr({x2: bbox.cx, y2: bbox.cy});
                console.log(element.id);
                if (!elem2line[id]) elem2line[id] = [];
                elem2line[id].push({line: line, start: false});
                connectors.push({n1: currentStart, n2: element.id});
                currentStart = null;
                console.log(elem2line);
            }
        };


    }


    function TextContext(drupyter) {

        var num = 0;
        var field = null;
        var text = null;

        this.onClick = function (e, element) {
            if (field) {
                $(field).remove();
                $(text.node).remove();
            }
            var offset = $(element.node).offset();
            var x = e.pageX - offset.left;
            var y = e.pageY - offset.top;
            var text = drupyter.snap.text(0, 0, "");
            var textGroup = drupyter.snap.group(text);
            drupyter.registerElement(textGroup);
            var svgns = "http://www.w3.org/2000/svg";
            var field = document.createElementNS(svgns, "foreignObject");
            field.setAttributeNS(null, "x", x);
            field.setAttributeNS(null, "y", y);
            field.setAttributeNS(null, "width", 50);
            field.setAttributeNS(null, "height", 30);
            var textInput = $("<input id='input" + num + "' type='text'>");
            $(field).append(textInput);
            // field.innerHTML = "<input type='text'>";
            // var textInput = $(field).children().get(0);
            $(drupyter.svg).append(field);
            console.log(textInput);
            textInput.focus();
            num += 1;


            $(field).keypress(function (e) {
                if (e.keyCode == 13) {
                    console.log($(textInput).val());
                    textGroup.attr({
                        transform: new Snap.Matrix(1, 0, 0, 1, x, y + $(textInput).height())
                    });

                    text.attr({
                        text: $(textInput).val()
                    });

                    // $(this).remove();
                    // field.innerHTML = "<div>" + $(textInput).val() + "</div>";
                    // var textDiv = $(field).children().get(0);
                    // var hidden = $(drupyter.container + ' div.hidden');
                    // hidden.text($(textInput).val());
                    // console.log(hidden);
                    $(field).remove();
                    // MathJax.Hub.Queue(["Typeset", MathJax.Hub, hidden.get(0)]);
                    // MathJax.Hub.Queue(function () {
                    //     console.log("Done!");
                    //     console.log(x);
                    //     console.log(y);
                    //     created_group = $(drupyter.container + ' div.hidden span svg g');
                    //
                    //     console.log(created_group);
                    //     $(drupyter.svg).append(created_group);
                    //     // snap_group = Snap(created_group.get(0));
                    //     // console.log(snap_group.node);
                    //     var myMatrix = new Snap.Matrix(0.05, 0, 0, -0.05, x, y);
                    //     created_group.attr({
                    //         transform: myMatrix
                    //     });
                    //     // // myMatrix.scale(0.05, -0.05);            // play with scaling before and after the rotate
                    //     // // myMatrix.translate(x, y);      // this translate will not be applied to the rotation
                    //     // // myMatrix.rotate(0);            // rotate
                    //     // snap_group.attr({transform: myMatrix});
                    //     // // var group = drupyter.snap.group(created_SVG.get(0));
                    //     // // console.log(group)
                    //     // $(drupyter.svg).append(snap_group.node);
                    //     drupyter.saveCurrentSVG();
                    // });

                }
            });

        };


    }

    function MakeRectangleContext(drupyter) {
        this.drupyter = drupyter;
        var self = this;
        var centerX = -1;
        var centerY = -1;
        var rect = null;

        this.onClick = function (e, element) {
            if (rect) {
                var bbox = rect.getBBox();
                var cx = bbox.cx;
                var cy = bbox.cy;
                var halfWidth = bbox.width / 2.0;
                var halfHeight = bbox.height / 2.0;
                var attr = {stroke: "#000", strokeWidth: 1, fill: '#fff', opacity: 0.0}; //fillOpacity: 0
                rect.addClass("core");
                var group = drupyter.snap.group(rect);
                group.append(drupyter.snap.circle(cx, cy - halfHeight, 5).attr(attr).addClass("endPoint up"));
                group.append(drupyter.snap.circle(cx, cy + halfHeight, 5).attr(attr).addClass("endPoint down"));
                group.append(drupyter.snap.circle(cx - halfWidth, cy, 5).attr(attr).addClass("endPoint left"));
                group.append(drupyter.snap.circle(cx + halfWidth, cy, 5).attr(attr).addClass("endPoint right"));
                // var group = drupyter.snap.group(circle, upEndPoint, downEndPoint, leftEndPoint, rightEndPoint);
                console.log(group);
                drupyter.registerElement(group);
                drupyter.saveCurrentSVG();
                rect = null;
            } else {
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                centerX = x;
                centerY = y;
                rect = drupyter.snap.rect(x, y, 0, 0);
                rect.attr({
                    fill: "#fff",
                    stroke: "#000",
                    strokeWidth: 1,
                    "vector-effect": "non-scaling-stroke"
                });
                // $(rect.node).click(function (e) {
                //     if (drupyter.currentContext.onClickElement) drupyter.currentContext.onClickElement(e, remembered);
                // });
            }
        };

        this.onMouseMove = function (e, element) {
            if (rect) {
                console.log("Changing ...");
                var offset = $(element.node).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                var top = Math.min(y, centerY);
                var left = Math.min(x, centerX);
                var width = Math.max(x, centerX) - left;
                var height = Math.max(y, centerY) - top;


                rect.attr({
                    x: left,
                    y: top,
                    height: height,
                    width: width,
                })
            }
        };

        this.onClickElement = function (e, element) {
            console.log("Selected in MakeCircle Mode");
        }


    }

    return {
        Egal: Egal
    }
});
