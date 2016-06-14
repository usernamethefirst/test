function drawHisto1DStack(urlJson, mydiv) {

    var div = d3.select('#' + mydiv);
    var svg = div.select("svg");

    //table for legend
    svg.tableWidth = 200;
    var divWidth = parseInt(div.style("width"),10), divHeight = window.innerHeight*0.8;

    var table = div.select("table").style("width",svg.tableWidth + "px").style("max-height",(divHeight-50) + "px");




    svg.attr("width",divWidth-1.1*svg.tableWidth).attr("height",divHeight);

    svg.margin = {top: 50, right: 50, bottom: 50, left: 50, zero:30};
    svg.width = divWidth-1.1*svg.tableWidth - svg.margin.left - svg.margin.right;
    svg.height = divHeight - svg.margin.bottom - svg.margin.top;



    svg.x = d3.scale.linear()
        .range([0, svg.width]);

    svg.yInput = d3.scale.linear().clamp(true);

    svg.yOutput = d3.scale.linear().clamp(true);

    svg.svg = svg.append("svg").attr("x",svg.margin.left).attr("y",svg.margin.top).attr("width",svg.width).attr("height",svg.height);


    //Will contain the chart itself, without the axis
    svg.chartBackground = svg.svg.append("g");
    svg.chartInput = svg.svg.append('g');
    svg.chartOutput = svg.svg.append('g');


    //Will contain the axis and the rectselec, for a better display of scaling
    svg.frame = svg.svg.append("g");

    svg.selec = svg.frame.append("rect").attr("class", "rectSelec");


    d3.json(urlJson, function (error, json) {
        json = json.data;
        svg.legend = json[1].legend;
        console.log(json);

        var valuesIn = [];
        var valuesOut = [];
        var xlength = json[1].legend.length;

        var colorMap = new Map();
        var sumMap = new Map();
        var i;

        colorMap.set(" Remainder ", "#f2f2f2");

        for (i = 2; i<json.length; i++ ){

            for(var j = 0; j < xlength; j++) {
                if(json[i].tab[j].y==0){
                    continue;
                }
                json[i].tab[j].x = j;
                json[i].tab[j].height = json[i].tab[j].y;

                if(!sumMap.has(json[i].tab[j].item)){
                    sumMap.set(json[i].tab[j].item,json[i].tab[j].height);
                }else{
                    sumMap.set(json[i].tab[j].item,sumMap.get(json[i].tab[j].item) + json[i].tab[j].height)
                }

                json[i].tab[j].stroke="#000000";

                if (i % 2 == 0) {
                    //json[i].tab[j].stroke = "#fff";
                    valuesIn.push(json[i].tab[j]);

                }else{
                    //json[i].tab[j].stroke="#cccccc";
                    valuesOut.push(json[i].tab[j]);

                }

            }
        }

        sumMap.delete(" Remainder ");
        var sumArray = [];

        var f = colorEval();


        sumMap.forEach(function(value,key){
            sumArray.push({item:key,sum:value});
        });

        sumArray.sort(function(a,b){
            return b.sum - a.sum;
        });

        console.log(sumArray);
        //The most importants elements should have distinct colors.

        sumArray.forEach(function(elem){
            colorMap.set(elem.item,f())
        });

        console.log(colorMap);


        function sortValues(a, b) {

            if(a.x - b.x !=0){
                return a.x - b.x;
            }
            if(a.item == " Remainder "){
                return -1;
            }
            if(b.item == " Remainder "){
                return 1;
            }
            return b.height - a.height;
        }

        valuesIn.sort(sortValues);
        valuesOut.sort(sortValues);


        //Evaluation of the abscissa domain
        svg.x.domain([-0.625,xlength-0.375]);

        var totalSumIn = [];
        var totalSumOut = [];

        var x = valuesIn[0].x;
        var sum = 0;
        i=0;

        while(x < xlength){

            while(i <  valuesIn.length && valuesIn[i].x == x){
                valuesIn[i].y = sum;
                sum += valuesIn[i].height;
                i++;
            }
            totalSumIn.push(sum);
            sum=0;
            x++;
        }

        x = valuesOut[0].x;
        i=0;

        while(x < xlength){

            while(i <  valuesOut.length && valuesOut[i].x == x){
                sum += valuesOut[i].height;
                valuesOut[i].y = sum;
                i++;
            }
            totalSumOut.push(sum);
            sum=0;
            x++;
        }


        var totalIn = d3.max(totalSumIn);
        var totalOut = d3.max(totalSumOut);

        svg.heightOutput = (svg.height - svg.margin.zero)*totalOut/(totalIn+totalOut);

        svg.yInput.range([svg.heightOutput+svg.margin.zero,svg.height]);
        svg.yOutput.range([svg.heightOutput,0]);


        //the *1.1 operation allow a little margin
        svg.yInput.domain([0,totalIn*1.1]);
        svg.yOutput.domain([0,totalOut*1.1]);

        //Text background
        svg.textOutput = svg.chartBackground.append("text").attr("transform", "translate(" + (svg.width/2) + "," +
          (svg.heightOutput/4) + ")")
          .classed("bckgr-txt",true)
          .style("fill","#e6e6e6")
          .text("Outgoing");

        svg.rectInput = svg.chartBackground.append("rect").attr("x",0).attr("y",svg.heightOutput+svg.margin.zero)
          .attr("width",svg.width)
          .attr("height",svg.height-svg.heightOutput-svg.margin.zero)
          .style("fill","#e6e6e6");

        svg.textInput = svg.chartBackground.append("text").attr("transform", "translate(" + (svg.width/2) + "," +
            ((svg.height - svg.heightOutput - svg.margin.zero) *0.75 + svg.heightOutput + svg.margin.zero) + ")")
          .classed("bckgr-txt",true)
          .text("Ingoing")
          .style("fill", "#fff");



        var dataWidth = 0.75*(svg.x(svg.x.domain()[0] + 1) - svg.x.range()[0]);
        var selectionIn = svg.chartInput.selectAll(".data")
            .data(valuesIn)
            .enter().append("rect")
                    .classed("data",true)
                    .attr("x", function(d){return svg.x(d.x - 0.375);})
                    .attr("y",function(d){
                                return svg.yInput(d.y);})
                    .attr("height", function(d){ return svg.yInput(d.height) - svg.yInput.range()[0];})
                    .attr("width",dataWidth)
                    .attr("fill",function(d){return colorMap.get(d.item);})
                    .attr("stroke",function(d){return d.stroke});

        var selectionOut = svg.chartOutput.selectAll(".data")
            .data(valuesOut)
            .enter().append("rect")
            .classed("data",true)
            .attr("x", function(d){return svg.x(d.x- 0.375);})
            .attr("y",function(d){
                return svg.yOutput(d.y);})
            .attr("height", function(d){ return svg.yOutput.range()[0] - svg.yOutput(d.height);})
            .attr("width",dataWidth)
            .attr("fill",function(d){return colorMap.get(d.item);})
            .attr("stroke",function(d){return d.stroke});

        var selection = svg.selectAll(".data");



        selection.append("svg:title")
            .text(function(d){
                return  d.item + "\n" + svg.legend[d.x].text + ", " + d.height.toFixed(2) + " " + json[0].unit;});



        function blink() {

            this.parentNode.appendChild(this);
            var rect = d3.select(this);

            var col1 = rect.attr("fill"), col2 = "#ffffff",col3 = "#ff0000",col4 = rect.datum().stroke;
            rect.attr("stroke",col3).attr("fill",col2);
            (function doitagain() {
                rect.transition().duration(1000)
                  .attr("stroke", col4).attr("fill",col1)
                  .transition().duration(1000)
                  .attr("stroke", col3).attr("fill",col2)
                  .each("end", doitagain);
            })()
        }


        function activationElems(d){

            var item = d.item;

            function testitem(d){
                return d.item == item;

            }

            trSelec.filter(testitem).classed("outlined",true);

            selection.filter(testitem).each(blink);

        }

        function activationElemsAutoScroll(d){

            var item = d.item;

            function testitem(d){
                return d.item == item;

            }

            var elem = trSelec.filter(testitem).classed("outlined",true);
            var tableViewHeight = table.property("clientHeight");
            //var tableScrollHeight = table.property("scrollHeight"); //not used anymore
            var tableScrollTop = table.property("scrollTop");
            var elemOffsetHeight = elem.property("offsetHeight");
            var elemOffsetTop = elem.property("offsetTop");
            var scrollEnd = (elemOffsetTop <= tableScrollTop) ? elemOffsetTop : Math.max(elemOffsetTop -tableViewHeight + elemOffsetHeight + 1,tableScrollTop);

            console.log("elemoffsettop " + elemOffsetTop);


            table.transition().ease(easeFct(3)).tween("scrolltoptween", function(){
                    return function(t){
                    this.scrollTop = tableScrollTop * (1-t) + t*scrollEnd;
                };
            });


            selection.filter(testitem).each(blink);

        }

        function desactivationElems(d){

            function testitem(data){
                return data.item == d.item;

            }

            if(svg.popup.pieChart == null) {
                trSelec.filter(testitem).classed("outlined", false);
            }

            selection.filter(testitem).transition().duration(0).attr("stroke",function(d){return d.stroke;}).attr("fill",colorMap.get(d.item));

        }

        selection.on("mouseover", activationElemsAutoScroll).on("mouseout",desactivationElems);




        svg.axisx = svg.append("g")
            .attr("class", "axis")
            .attr('transform', 'translate(' + [svg.margin.left, svg.heightOutput+svg.margin.top] +  ")");
        svg.axisx.append("rect").classed("rectAxis",true).attr("width",svg.width).attr("height",svg.margin.zero);

        svg.axisx.call(d3.svg.axis()
            .scale(svg.x)
            .orient("bottom"));
        svg.heightTick = svg.axisx.select(".tick").select("line").attr("y2");
        svg.axisx.path = svg.axisx.append("path").attr("d", "M0," + (svg.margin.zero - svg.heightTick) + "V" + svg.margin.zero + "H" + svg.width + "V" + (svg.margin.zero-svg.heightTick))

        svg.axisx.selectAll(".tick").classed("addedLine",true).append("line")
            .attr("x1",0)
            .attr("y1",svg.margin.zero - svg.heightTick)
            .attr("x2",0)
            .attr("y2",svg.margin.zero);

        svg.axisx.selectAll(".tick").select("text").text(function(){
            var text = d3.select(this).text();
            if (Math.floor(+text) != +text){
                d3.select(this).node().parentNode().remove();
            }else{
             return svg.legend[+text].text;
            }
        });

        svg.axisyInput = svg.append("g").attr('transform', 'translate(' + [svg.margin.left, svg.margin.top ] + ')')
            .attr("class", "axis");
        svg.axisyInput.call(d3.svg.axis()
            .scale(svg.yInput)
            .orient("left")
        );

        svg.axisyOutput = svg.append("g").attr('transform', 'translate(' + [svg.margin.left, svg.margin.top] + ')')
            .attr("class", "axis");
        svg.axisyOutput.call(d3.svg.axis()
            .scale(svg.yOutput)
            .orient("left"));


  //      Label of the y axis
        svg.ylabel = svg.axisyInput.append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("dy", ".75em")
            .attr('y',- svg.margin.left)
            .attr("x",- svg.height/2)
            .attr("transform", "rotate(-90)")
            .text(json[0].unit);

        svg.side = 0.75*Math.min(svg.height,svg.width);
        svg.pieside = 1*svg.side;
        var overlay = div.append("div").classed("overlay",true).style("display","none");
        svg.popup = div.append("div").classed("popup",true).style({"width":svg.side + "px","height":svg.side + "px","display":"none",
                                        "left":((svg.width-svg.side)/2 +svg.margin.left)+"px" ,"top": ((svg.height-svg.side)/2 +svg.margin.top) + "px"});
        svg.popup.pieChart = null;


        selection.on("click",function(d){
            if(svg.popup.pieChart == null) {
                overlay.style("display",null);
                svg.popup.pieChart = svg.popup.append("svg").attr("width", svg.pieside).attr("height", svg.pieside).classed("pieSvg",true);
                drawComplData("./datacompl.json",svg.popup,svg.pieside,d.height);
                svg.popup.style("display",null);
                d3.event.stopPropagation();

            }
        });

        svg.popup.on("click",function(){
            d3.event.stopPropagation();
        });

        d3.select(window).on("click." + mydiv,function(){
            if(svg.popup.pieChart != null){
                trSelec.classed("outlined",false);
                overlay.style("display","none");
                svg.popup.style("display","none");
                svg.popup.pieChart.remove();
                svg.popup.pieChart = null;
            }
        });

        //Legend creation
        
        var trSelec;
        sumArray.unshift({item:" Remainder "});
        trSelec = table.selectAll("tr").data(sumArray).enter().append("tr");
        trSelec.append("td").classed("color",true).append("div").classed("lgd",true).style("background-color", function(d){return colorMap.get(d.item);});
        trSelec.append("td").classed("item",true).text(function(d){return d.item;});

        trSelec.on("mouseover",activationElems).on("mouseout",desactivationElems);


        //zoom
        

        svg.newX = d3.scale.linear().range(svg.x.range()).domain(svg.x.domain());
        svg.newYOutput = d3.scale.linear().range(svg.yOutput.range()).domain(svg.yOutput.domain());
        svg.newYInput = d3.scale.linear().range(svg.yInput.range()).domain(svg.yInput.domain());


        addZoomDouble(svg,updateHisto1DStack);
        d3.select(window).on("resize." + mydiv, function(){
            console.log("resize");
            redraw(div,svg);
        } );


    });
}


/***********************************************************************************************************/


function updateHisto1DStack(svg){
/*

    svg.chartOutput.attr("transform","matrix(" + (svg.scalex*svg.scale) + ", 0, 0, " + (svg.scaley*svg.scale) + ", " + svg.translate[0] + "," + svg.translate[1] + ")" );

    svg.chartInput.attr("transform","matrix(" + (svg.scalex*svg.scale) + ", 0, 0, " + (svg.scaley*svg.scale) + ", " + svg.translate[0] + "," + (svg.translate[1] - (svg.scaley*svg.scale-1)*svg.margin.zero) + ")" );
*/


    var newHeightOuput = svg.newYOutput(svg.yOutput.domain()[0]);
    var newHOmarg = svg.newYInput(svg.yInput.domain()[0]);

    svg.rectInput.attr("y", newHOmarg).attr("height",svg.height-newHOmarg);
    svg.textOutput.attr("transform", "translate(" + (svg.width/2) + "," +
      Math.min(newHeightOuput, svg.height)/4 + ")");


    svg.textInput.attr("transform", "translate(" + (svg.width/2) + "," +
        ((svg.height - Math.max(0,newHOmarg)) *0.75 + Math.max(0,newHOmarg)) + ")");


    var dataWidth = 0.75*(svg.newX(svg.newX.domain()[0] + 1) - svg.newX.range()[0]);

    svg.chartInput.selectAll(".data")
      .attr("x",function(d){return svg.newX(d.x - 0.375);})
      .attr("y", function(d){return svg.newYInput(d.y);})
      .attr("height", function(d){return svg.newYInput(d.height) - newHOmarg;})
      .attr("width", dataWidth);




    svg.chartOutput.selectAll(".data")
      .attr("x",function(d){return svg.newX(d.x - 0.375);})
      .attr("y", function(d){return svg.newYOutput(d.y);})
      .attr("height", function(d){return newHeightOuput - svg.newYOutput(d.height);})
      .attr("width", dataWidth);


    svg.axisx.call(d3.svg.axis()
        .scale(svg.newX)
        .orient("bottom"));

    svg.axisx.selectAll(".tick").filter(function(){return !d3.select(this).classed("addedLine");}).classed("addedLine",true).append("line")
        .attr("x1",0)
        .attr("y1",svg.margin.zero - svg.heightTick)
        .attr("x2",0)
        .attr("y2",svg.margin.zero);

    svg.axisx.selectAll(".tick").select("text").text(function(){
        var text = d3.select(this).text();
        if (Math.floor(+text) != +text){
            d3.select(this).node().parentNode.remove();
        }else{
            return svg.legend[+text].text;
        }
    });

    svg.axisx.attr("transform","matrix(1, 0, 0, 1," + svg.margin.left+ "," + Math.min(svg.margin.top + svg.height,Math.max(svg.margin.top - svg.margin.zero,(svg.heightOutput)*svg.scale*svg.scaley +svg.margin.top + svg.translate[1])) + ")" );


    svg.axisyOutput.call(d3.svg.axis()
        .scale(svg.newYOutput)
        .orient("left"));

    svg.axisyInput.call(d3.svg.axis()
        .scale(svg.newYInput)
        .orient("left"));



}



/***********************************************************************************************************/


function addZoomDouble(svg,updateFunction){

    if(svg.svg == undefined){
        svg.svg=svg;
    }

    //Scales to update the current view (if not already implemented for specific reasons)
    if(svg.newX == undefined){
        svg.newX = d3.scale.linear().range(svg.x.range()).clamp(true).domain(svg.x.domain());
    }
    if(svg.newYOutput == undefined) {
        svg.newYOutput = d3.scale.linear().range(svg.yOutput.range()).clamp(true).domain(svg.yOutput.domain());
    }

    if(svg.newYInput == undefined) {
        svg.newYInput = d3.scale.linear().range(svg.yInput.range()).clamp(true).domain(svg.yInput.domain());
    }

    //Selection rectangle for zooming (if not already implemented for better display control)
    if(svg.selec == undefined){
        svg.selec = svg.frame.append("rect").attr("class", "rectSelec");
    }



    var startCoord = [NaN,NaN];
    var mouseCoord;


    svg.scale = 1;
    svg.scalex = 1;
    svg.scaley = 1;

    //coordinates within the x&y ranges frames, points towards the top left corner of the actual view
    //workaround for the zoom.translate([0,0]) which doesn't work as intended.
    svg.translate = [0,0];

    //Vector pointing towards the top left corner of the current view in the x&y ranges frame
    //Calculated from svg.translate
    var actTranslate = [0,0];


    //to stop triggering animations during rectselec
    var rectOverlay = svg.frame.append("rect").attr("x",0).attr("y",0)
      .attr("height",svg.height).attr("width",0).attr("fill-opacity",0).classed("rectOverlay",true);


    svg.heightData = svg.height - svg.margin.zero;

    svg.zoom = d3.behavior.zoom().scaleExtent([1, Infinity]).center([0,0]).on("zoom", function () {

            mouseCoord = d3.mouse(svg.frame.node());


            if(isNaN(startCoord[0])){

                var e = d3.event;

                if(e.scale == svg.scale){
                    //case: translation

                    //Avoid some "false" executions
                    if(e.scale != 1){
                        svg.style("cursor", "move");

                    }

                    console.log("e.translate " + e.translate);


                    //actualization of the translation vector (translate) within the x&y ranges frames
                    svg.translate[0] = Math.min(0, Math.max(e.translate[0],svg.width - e.scale*svg.scalex*svg.width ));
                    svg.translate[1] = Math.min(0, Math.max(e.translate[1],svg.height - e.scale*svg.scaley*svg.heightData - svg.margin.zero));


                }else{

                    //case: zoom


                    var lastScalex = svg.scalex;
                    var lastScaley = svg.scaley;

                    //Actualization of the local scales
                    svg.scalex = Math.max(1/e.scale, svg.scalex);
                    svg.scaley = Math.max(1/e.scale, svg.scaley);

                    //Evaluation of the scale changes by axis
                    var xrel = (svg.scalex * e.scale)/(svg.scale * lastScalex);
                    var yrel = (svg.scaley * e.scale)/(svg.scale * lastScaley);

                    //console.log("zoom " + svg.translate + " e.t " + e.translate);


                    //actualization of the translation vector with the scale change
                    svg.translate[0]*= xrel;

                    //actualization of the translation vector (translate) to the top left corner of our view within the standard x&y.range() frame
                    //If possible, the absolute location pointed by the cursor stay the same
                    //Since zoom.translate(translate) doesn't work immediately but at the end of all consecutive zoom actions,
                    //we can't rely on d3.event.translate for smooth zooming and have to separate zoom & translation
                    svg.translate[0] = Math.min(0, Math.max(svg.translate[0] - mouseCoord[0]*(xrel - 1),svg.width - e.scale*svg.scalex*svg.width ));

                    var oldMouse = mouseCoord[1] - svg.translate[1];
                    
                    var newMouse = oldMouse* yrel + Math.min(svg.margin.zero, Math.max(0,oldMouse - svg.heightOutput*svg.scale*lastScaley))*(1 - yrel);
                    svg.translate[1] = oldMouse - newMouse + svg.translate[1];
                    svg.translate[1] = Math.min(0, Math.max(svg.translate[1],svg.height - e.scale*svg.scaley*svg.heightData - svg.margin.zero));

                    //console.log("newmouse :" + newMouse + " oldMouse :" + oldMouse);

                    svg.scale = e.scale;

                    //console.log(" lastScalex " + lastScalex + " scalex " + svg.scalex + " lastScaley " + lastScaley + " scaley " + svg.scaley + " xrel " + xrel + " yrel " + yrel);
                }


                svg.zoom.translate(svg.translate);


                actTranslate[0] = -svg.translate[0]/(svg.scalex*e.scale);
                actTranslate[1] = -svg.translate[1]/(svg.scaley*e.scale);


                //actualization of the current (newX&Y) scales domains
                svg.newX.domain([ svg.x.invert(actTranslate[0]), svg.x.invert(actTranslate[0] + svg.width/(e.scale*svg.scalex)) ]);

                svg.newYOutput.range([Math.min(svg.height,Math.max(0,svg.heightOutput*svg.scale*svg.scaley+svg.translate[1])),0]);
                svg.newYInput.range([Math.min(svg.height,Math.max(0,svg.heightOutput*svg.scale*svg.scaley+svg.translate[1] + svg.margin.zero)),svg.height]);

                svg.newYOutput.domain([svg.yOutput.invert(svg.height/(svg.scale*svg.scaley) + actTranslate[1]),
                    svg.yOutput.invert(actTranslate[1])]);

                svg.newYInput.domain([svg.yInput.invert(actTranslate[1]  + (1-1/(svg.scale*svg.scaley))*svg.margin.zero),
                    svg.yInput.invert(actTranslate[1] + (1-1/(svg.scale*svg.scaley))*svg.margin.zero + svg.height/(svg.scale*svg.scaley))]);



                updateFunction(svg);



            } else {

                //Drawing of the selection rect
                console.log("carré mousecoord " + mouseCoord + " start " + startCoord );

                mouseCoord[0] = Math.min(Math.max(mouseCoord[0],svg.x.range()[0]),svg.x.range()[1]);
                mouseCoord[1] = Math.min(Math.max(mouseCoord[1],0),svg.height);

                svg.selec.attr("x", Math.min(mouseCoord[0],startCoord[0]))
                    .attr("y", Math.min(mouseCoord[1],startCoord[1]))
                    .attr("width",  Math.abs(mouseCoord[0] - startCoord[0]))
                    .attr("height", Math.abs(mouseCoord[1] - startCoord[1]));
            }


        })

        .on("zoomstart",function () {
            console.log("translate1 " + svg.translate[1] );
            if(isShiftKeyDown){
                console.log("key is down start");
                rectOverlay.attr("width",svg.width);
                startCoord = d3.mouse(svg.frame.node());
                startCoord[0] = Math.min(Math.max(startCoord[0],svg.x.range()[0]),svg.x.range()[1]);
                startCoord[1] = Math.min(Math.max(startCoord[1],0),svg.height);

                svg.style("cursor","crosshair");
            }

        })
        .on("zoomend", function () {

            if(!isNaN(startCoord[0])){

                rectOverlay.attr("width",0);


                svg.selec.attr("width",  0)
                    .attr("height", 0);

                //Top left corner coordinates of the selection rectangle
                var xmin = Math.min(mouseCoord[0],startCoord[0]);
                var ymin = Math.min(mouseCoord[1],startCoord[1]);
                var ymax = ymin + Math.abs(mouseCoord[1] - startCoord[1]);


                var marginIncl = Math.max(0,ymax - ymin + svg.margin.zero -
                    Math.max(svg.heightOutput*svg.scale*svg.scaley + svg.translate[1] + svg.margin.zero,ymax)
                    + Math.min(ymin,svg.heightOutput*svg.scale*svg.scaley + svg.translate[1]));

                var sqheight = ymax - ymin - marginIncl;


                var sqwidth = Math.abs(mouseCoord[0] - startCoord[0]);


                if(sqwidth != 0 && sqheight != 0){

                    var lastScale = svg.scale;
                    var lastScalex = svg.scalex;
                    var lastScaley = svg.scaley;



                    //Repercussion on the translate vector
                    svg.translate[0] = svg.translate[0] - xmin;
                    
                    svg.translate[1] = svg.translate[1] - ymin;
                    //Evaluation of the total scale change from the beginning, by axis.
                    svg.scalex = svg.width*svg.scale*svg.scalex/sqwidth;

                    svg.scaley = (svg.height-marginIncl)*svg.scale*svg.scaley/sqheight;

                    //Evaluation of the global scale
                    svg.scale = Math.max(svg.scalex,svg.scaley);

                    //Evaluation of the local scale change (with 0<svg.scalen<=1 &&
                    // total scale change for n axis == svg.scalen*svg.scale >=1)
                    svg.scalex = svg.scalex/svg.scale;
                    svg.scaley = svg.scaley/svg.scale;

                    //Evaluation of the ratio by axis between the new & old scales
                    var xrel = (svg.scalex * svg.scale)/(lastScale * lastScalex);
                    var yrel = (svg.scaley * svg.scale)/(lastScale * lastScaley);
                    //Actualization of the translate vector
                    svg.translate[0]*= xrel;
                    svg.translate[1] = svg.translate[1]*yrel + Math.max(-svg.margin.zero,Math.min(svg.translate[1] + lastScaley*lastScale*svg.heightOutput,0))*(1-yrel);


                    actTranslate[1] = -svg.translate[1]/(svg.scaley*svg.scale);


                    //actualization of the current (newX&Y) scales domains
                    svg.newX.domain([ svg.newX.invert(xmin), svg.newX.invert(xmin + sqwidth)]);
                    svg.newYOutput.range([Math.min(svg.height,Math.max(0,svg.heightOutput*svg.scale*svg.scaley+svg.translate[1])),0]);
                    svg.newYInput.range([Math.min(svg.height,Math.max(0,svg.heightOutput*svg.scale*svg.scaley+svg.translate[1] + svg.margin.zero)),svg.height]);

                    svg.newYOutput.domain([svg.yOutput.invert(svg.height/(svg.scale*svg.scaley) + actTranslate[1]),
                        svg.yOutput.invert(actTranslate[1])]);

                    svg.newYInput.domain([svg.yInput.invert(actTranslate[1]  + (1-1/(svg.scale*svg.scaley))*svg.margin.zero),
                        svg.yInput.invert(actTranslate[1] + (1-1/(svg.scale*svg.scaley))*svg.margin.zero + svg.height/(svg.scale*svg.scaley))]);


                    updateFunction(svg);
                }

                //update of the zoom behavior
                svg.zoom.scale(svg.scale);
                svg.zoom.translate(svg.translate);

                startCoord = [NaN,NaN];


            }
            svg.style("cursor","auto");


        });

    svg.call(svg.zoom).on("dblclick.zoom", null);
}
/************************************************************************************************************/

function redraw(div,svg){

    var divWidth = Math.max(1.1*svg.tableWidth + svg.margin.left + svg.margin.right + 1,parseInt(div.style("width"),10)),
      divHeight = Math.max(svg.margin.bottom + svg.margin.top + svg.margin.zero + 2,window.innerHeight*0.8);
    console.log("width " + divWidth );

    var oldsvgheight = svg.height;
    var oldsvgwidth = svg.width;

    svg.attr("width",divWidth-1.1*svg.tableWidth).attr("height",divHeight);

    svg.width = divWidth-1.1*svg.tableWidth - svg.margin.left - svg.margin.right;
    svg.height = divHeight - svg.margin.bottom - svg.margin.top;
    div.select("table").style("max-height",(divHeight-50) + "px");

    var oldheightoutput = svg.heightOutput;

    /* a calculerrrr
    var oldheightData = svg.heightData;
    svg.heightData = svg.;
*/
    
    var margIncTransl = Math.max(-svg.margin.zero,Math.min(svg.translate[1] + (svg.scale*svg.scaley)*oldheightoutput,0));
    var margInView = Math.max(-svg.margin.zero,Math.min((svg.translate[1]-oldsvgheight) + (svg.scale*svg.scaley)*oldheightoutput,0)) - margIncTransl;

    var oldheightData = svg.heightData;
    svg.heightData = svg.height - svg.margin.zero;
    svg.heightOutput = svg.heightOutput*svg.heightData/oldheightData;


    console.log("marginview " + margInView);

  
    var ratiox = svg.width/oldsvgwidth;

    svg.x.range([0, svg.width]);

    svg.yInput.range([svg.heightOutput+svg.margin.zero,svg.height]);
    svg.yOutput.range([svg.heightOutput,0]);

    svg.svg.attr("width",svg.width).attr("height",svg.height);



    svg.rectInput.attr("width",svg.width);


    svg.axisx.select(".rectAxis").attr("width",svg.width);

    svg.axisx.path.attr("d", "M0," + (svg.margin.zero - svg.heightTick) + "V" + svg.margin.zero + "H" + svg.width + "V" + (svg.margin.zero-svg.heightTick))

    svg.ylabel.attr("x",- svg.height/2).attr('y',- svg.margin.left);

    svg.frame.select(".rectOverlay").attr("height",svg.height);


    //...


    console.log("marincltransl " + margIncTransl);
    svg.translate[1] = (svg.translate[1] - margIncTransl) * (svg.height + margInView)/(oldsvgheight + margInView) + margIncTransl;
    svg.translate[0] = svg.translate[0]*ratiox;

    var oldscaleytot = svg.scale*svg.scaley;
    var oldscalextot = svg.scale*svg.scalex;

    var scaleytot = oldscaleytot * (svg.height + margInView) * oldheightData / (svg.heightData * (oldsvgheight + margInView)) ;
 
    var scalextot = svg.scale*svg.scalex;
 
    svg.scale = Math.max(scalextot,scaleytot);
    svg.scalex = scalextot/svg.scale;
    svg.scaley = scaleytot/svg.scale;
 
    svg.zoom.scale(svg.scale);


    svg.newX.range([0,svg.width]);
    svg.newYOutput.range([Math.min(svg.height,Math.max(0,svg.heightOutput*svg.scale*svg.scaley+svg.translate[1])),0]);
    svg.newYInput.range([Math.min(svg.height,Math.max(0,svg.heightOutput*svg.scale*svg.scaley+svg.translate[1] + svg.margin.zero)),svg.height]);
    svg.zoom.translate(svg.translate);
    console.log("redraw translate1 " + svg.translate[1]);

    updateHisto1DStack(svg);


    svg.side = 0.75*Math.min(svg.height,svg.width);
    svg.pieside = 1*svg.side;

    svg.popup.style({"width":svg.side + "px","height":svg.side + "px",
        "left":((svg.width-svg.side)/2 +svg.margin.left)+"px" ,"top": ((svg.height-svg.side)/2 +svg.margin.top) + "px"});

    if(svg.popup.pieChart != null){
        svg.popup.pieChart.attr("width", svg.pieside).attr("height", svg.pieside);
        var chartside = 0.75*svg.pieside;
        svg.popup.innerRad = 0;
        svg.popup.outerRad = chartside/2;
        svg.popup.g.attr("transform","translate(" + (svg.pieside/2) + "," + (svg.pieside/2) + ")");

        var arc = d3.svg.arc()
          .innerRadius(svg.popup.innerRad)
          .outerRadius(svg.popup.outerRad)
          .startAngle(function(d){return d.startAngle})
          .endAngle(function(d){return d.endAngle});

        svg.popup.pieParts.attr("d",arc);
        svg.popup.pieText.attr("transform",function(d){
              var midAngle = (d.endAngle + d.startAngle)/2;
              var dist = svg.popup.outerRad * 0.8;
              return "translate(" + (Math.sin(midAngle)*dist) + "," +(-Math.cos(midAngle)*dist) +")";})



    }


}



/************************************************************************************************************/

function drawComplData(urlJson,popup,pieside,total){

    var chartside = 0.75*pieside;


    //TEMPORAIRE: test, à supprimer lors de l'utilisation avec de véritables valeurs.
    console.log(total);
    total=6000000000;
    //TEMPORAIRE

    popup.innerRad = 0;
    popup.outerRad = chartside/2;
    var dist = popup.outerRad * 0.8;


    d3.json(urlJson,function(error, json){

        var values = json.data;

        var sum = d3.sum(values,function(e){
            return e.y;
        });

        values.sort(function(a,b){
            return a.y -b.y;
        });

        var f = colorEval();
        var listColors = [];
        var length = values.length;


        for(var w = 0; w < length; w++){

            listColors.push(f())

        }

        values.push({y: total -sum, hostname:" Remainder ",amount:bytesConvert(total-sum)});

        listColors.push("#f2f2f2");



        function anglesCalc(){
            var posAngle = 0;
            return function(value){
                value.startAngle = posAngle;
                posAngle += 2*Math.PI * value.y / total;
                value.endAngle = posAngle;
            }
        }

        var functAngles = anglesCalc();

        values.forEach(functAngles);

/*
        var f = colorEval();

        for(var w = 0; w < 40; w++){

            console.log("val: " + f().h);

        }
*/


        var arc = d3.svg.arc()
          .innerRadius(popup.innerRad)
          .outerRadius(popup.outerRad);

        function interpolateArc(d){

            //.toFixed(5) avoid having complete circles at the beginning of the transition,
            //if start and end angles are too close, the precision isn't good enough to order them
            //correctly and d3 can creates a 2PI angle.

            return function(t){
                return (arc
                  .startAngle(d.startAngle)
                  .endAngle((d.startAngle + t * (d.endAngle - d.startAngle)).toFixed(5)))();
            }

        }

        popup.g = popup.pieChart.append("g")
          .attr("transform","translate(" + (pieside/2) + "," + (pieside/2) + ")");
        popup.pieElements = popup.g
          .selectAll(".elem").data(values).enter()
          .append("g")
          .classed("elem",true);

        popup.pieParts = popup.pieElements.append("path")
          .attr("d","")
          .style("fill",function(d,i){ return listColors[i]; })
          .classed("part",true);
        
        popup.pieParts.transition().ease(easeFct(3)).duration(1000).attrTween("d",interpolateArc);

        popup.pieParts.append("svg:title").text(function(d){
            return  d.hostname + "\n" + d.amount});

        popup.pieText = popup.g.selectAll("text").data(values).enter().append("text").classed("elemtext",true)
          .attr("transform",function(d){
              var midAngle = (d.endAngle + d.startAngle)/2;
              return "translate(" + (Math.sin(midAngle)*dist) + "," +(-Math.cos(midAngle)*dist) +")";})
          .text(function(d){ return d.amount;});

        popup.pieElements.on("mouseover",function(d){
            var part = d3.select(this);
            var midAngle = (d.endAngle + d.startAngle)/2;
            var distTranslTemp = popup.outerRad/4;
            var distTransl = popup.outerRad/10;

            part.transition()
              .attr("transform","translate(" + (Math.sin(midAngle)*distTranslTemp) + "," +(-Math.cos(midAngle)*distTranslTemp) +")" )
              .transition()
              .attr("transform","translate(" + (Math.sin(midAngle)*distTransl) + "," +(-Math.cos(midAngle)*distTransl) +")" );

            popup.pieText.filter(function(data){return data.hostname == d.hostname}).transition()
              .attr("transform","translate(" + (Math.sin(midAngle)*(distTranslTemp + dist)) + "," +(-Math.cos(midAngle)*(distTranslTemp+dist)) +")" )
              .transition()
              .attr("transform","translate(" + (Math.sin(midAngle)*(distTransl+dist)) + "," +(-Math.cos(midAngle)*(distTransl+dist)) +")" );

            part.on("mouseout",function(){
                    part.transition().attr("transform", "translate(0,0)");
                popup.pieText.filter(function(data){return data.hostname == d.hostname}).transition().attr("transform", "translate(" + (Math.sin(midAngle)*dist) + "," +(-Math.cos(midAngle)*dist) +")");

            });
        })

    });
}

/************************************************************************************************************

 convert bytes to NiB string

************************************************************************************************************/

function bytesConvert(nbBytes){

    var exp = Math.floor(Math.log(nbBytes)/Math.log(1024));

    var value = (nbBytes/Math.pow(1024,exp)).toFixed(1);

    if(value == Math.floor(value)){
        value = Math.floor(value);
    }

    switch (exp){

        case 0:
            return value + " B";
        case 1 :
            return value + " KB";
        case 2 :
            return value + " MB";
        case 3 :
            return value + " GB";
        case 4 :
            return value + " TB";
        case 5 :
            return value + " PB";
        case 6 :
            return value + " EB";
        case 7 :
            return value + " ZB";
        default:
        case 8 :
            return value + " YB";
    }

}


/************************************************************************************************************

 Return a function that should give a new color each, two successive colors should be different enough.


 ************************************************************************************************************/

/*

function colorEval(){

    var lim = 5;
    var threshold = 360/Math.pow(2,lim);

    var val = 0;
    var extent = 360;
    var color;

    var j = -1;
    var ylim = 5;
    var ystart = ylim, zstart = 3;
    var ythresh = ystart;
    var y = ystart;
    var z = zstart;

    var start = 0.4;
    var segm = (0.8 - start)/6;


    var s = start + segm*y;
    var l = start + segm*z;


    return function(){

        color = d3.hsl(val,s,l);
        val = val + j*180 + extent * (1+j)/2;
        j = -1 * j;


        y = (y+4)%7;
        if(y==ythresh){
            y++;
            ythresh++;
        }
        z = (z+4)%7;
        s = y*segm +start;
        l= z*segm+start;


        if(val >= 360){

            extent = extent/2;

            if(extent <= threshold){
                val = 0;
                extent = 360;
                ystart = (ystart+4)%7;
                if(ystart==ylim){
                    ylim++;
                    ystart++;
                }
                zstart = (zstart+4)%7;
                y=ystart;
                z=zstart;
                ythresh = ystart;
                s = start + segm*y;
                l = start + segm*z;
            }else{
                val = extent/2 + 180;
            }
        }

        return color;
    }
}

*/
/************************************************************************************************************/




function colorEval(){

    var calcexpmin;
    var idecal;
    var val = 0;
    var exp;
    var i = 0;


    var color;

    var y = 5;
    var z = 3;

    var start = 0.4;
    var segm = (0.8 - start)/6;


    var s = start + segm*y;
    var l = start + segm*z;


    return function(){
        i++;
        color = d3.hsl(val,s,l);
        exp = Math.floor(Math.log(i)/Math.log(2));
        idecal = i - Math.pow(2,exp);
        calcexpmin = exp + 1;
        do{
            idecal = idecal / 2;
            calcexpmin --;
        }
        while(idecal == Math.floor(idecal) && calcexpmin > 0);

        console.log("i " + i + "  exp " + exp + " idecal "+ idecal + " calcexpmin " + calcexpmin);

        val =(val + Math.pow(2,calcexpmin)*180/Math.pow(2,exp))%360;
        console.log("val " + val);


        y = (y+4)%7;
        z = (z+4)%7;
        s = y*segm +start;
        l= z*segm +start;



        return color;
    }
}


/************************************************************************************************************/

function easeFct(exp){
    var exp = exp;
    var a = Math.pow(2,exp-1);

    return function(t){

        return (t<.5)?a*Math.pow(t,exp):Math.min(1,1-a*Math.pow(1-t,exp));

    }

}



/************************************************************************************************************/



isShiftKeyDown = false;
d3.select(window).on("keydown",function (){

        if( d3.event.keyCode == '16'){
            isShiftKeyDown = true;
            console.log("shiftdown");
        }
    })
    .on("keyup",function () {
        if( d3.event.keyCode == '16'){
            isShiftKeyDown = false;

            console.log("shiftup");
        }
    });


drawHisto1DStack("./data.json", "Graph");
//drawHisto1DStack("./data2.json", "Graph2");