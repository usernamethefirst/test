function drawHisto1DStack(urlJson, mysvg) {

    var svg = d3.select('#' + mysvg);
    svg.margin = {top: 50, right: 50, bottom: 50, left: 50, zero:30};
    svg.width = parseInt(d3.select('#' + mysvg).attr('width'), 10) - svg.margin.left - svg.margin.right;
    svg.height = parseInt(d3.select('#' + mysvg).attr('height'), 10) - svg.margin.bottom - svg.margin.top;



    svg.x = d3.scale.linear()
        .range([0, svg.width]);

    svg.yInput = d3.scale.linear().clamp(true);

    svg.yOutput = d3.scale.linear().clamp(true);

    svg.y = function(e){
        if(e>0){
            return svg.yOutput(e);
        }
        return svg.yInput(e);
    };

    svg.svg = svg.append("svg");

    //Will contain the chart itself, without the axis
    svg.chartInput = svg.svg.attr("x",svg.margin.left).attr("y",svg.margin.top).attr("width",svg.width).attr("height",svg.height).append('g');
    svg.chartOutput = svg.svg.attr("x",svg.margin.left).attr("y",svg.margin.top).attr("width",svg.width).attr("height",svg.height).append('g');

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

        for (var i = 2; i<json.length; i++ ){

            for(var j = 0; j < xlength; j++) {
                json[i].tab[j].x = j;
                json[i].tab[j].height = json[i].tab[j].y;

                if (i % 2 == 0) {

                    valuesIn.push(json[i].tab[j]);

                }else{

                    valuesOut.push(json[i].tab[j]);

                }

            }
        }


        function sortValues(a, b) {
            if(a.x - b.x !=0){
                return a.x - b.x;
            }
            return b.height - a.height;
        }

        valuesIn.sort(sortValues);
        valuesOut.sort(sortValues);


        //Evaluation of the abscissa domain
        svg.x.domain([-0.375,xlength-0.375]);


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
        var total = d3.max([totalIn,totalOut]);

        svg.heightOutput = (svg.height - svg.margin.zero)*totalOut/(totalIn+totalOut);

        svg.yInput.range([svg.heightOutput+svg.margin.zero,svg.height]);
        svg.yOutput.range([svg.heightOutput,0]);

        svg.yInput.domain([0,totalIn]);
        svg.yOutput.domain([0,totalOut]);




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
                    .attr("fill",function(d){return d.color;});

        var selectionOut = svg.chartOutput.selectAll(".data")
            .data(valuesOut)
            .enter().append("rect")
            .classed("data",true)
            .attr("x", function(d){return svg.x(d.x- 0.375);})
            .attr("y",function(d){
                return svg.yOutput(d.y);})
            .attr("height", function(d){ return svg.yOutput.range()[0] - svg.yOutput(d.height);})
            .attr("width",dataWidth)
            .attr("fill",function(d){return d.color;});




        selectionIn.append("svg:title")
            .text(function(d){
                return "y:" + d.y + " x " + d.x + " height " + d.height + " color " + d.color;});


        selectionOut.append("svg:title")
            .text(function(d){
                return "y:" + d.y + " x " + d.x + " height " + d.height + " color " + d.color;});



        svg.axisx = svg.append("g")
            .attr("class", "axis")
            .attr('transform', 'translate(' + [svg.margin.left, svg.heightOutput+svg.margin.top] +  ")");

        svg.axisx.call(d3.svg.axis()
            .scale(svg.x)
            .orient("bottom"));
        svg.heightTick = svg.axisx.select(".tick").select("line").attr("y2");
        svg.axisx.append("path").attr("d", "M0," + (svg.margin.zero - svg.heightTick) + "V" + svg.margin.zero + "H" + svg.width + "V" + (svg.margin.zero-svg.heightTick))

        svg.axisx.selectAll(".tick").classed("addedLine",true).append("line")
            .attr("x1",0)
            .attr("y1",svg.margin.zero - svg.heightTick)
            .attr("x2",0)
            .attr("y2",svg.margin.zero);
        svg.axisx.selectAll(".tick").select("text").text(function(){
            var text = d3.select(this).text();
            if (Math.floor(+text) != +text){
                d3.select(this).node().parentNode().remove();
                return;
            }else{
             return svg.legend[+text].text;
            }
        });

        svg.axisyInput = svg.append("g").attr('transform', 'translate(' + [svg.margin.left, svg.margin.top ] + ')')
            .attr("class", "axis");
        svg.axisyInput.call(d3.svg.axis()
            .scale(svg.yInput)
            .orient("left"));

        svg.axisyOutput = svg.append("g").attr('transform', 'translate(' + [svg.margin.left, svg.margin.top] + ')')
            .attr("class", "axis");
        svg.axisyOutput.call(d3.svg.axis()
            .scale(svg.yOutput)
            .orient("left"));

        /*
        // Label of the x axis
        svg.xlabel = svg.axisx.append("text")
            .attr("class", "label")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", - 6)
            .text("Time");

        // Label of the y axis
        svg.ylabel = svg.axisy.append("text")
            .attr("class", "label")
            .attr("text-anchor", "end")
            .attr("y", 6 )
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text("Number of Strips");
         

        //color legend

        svg.append("text")
            .attr("x", width + margin.left + 1)
            .attr("y",  margin.top + 5)
            .attr("text-anchor", "start")
            .classed("label",true)
            .text("Legend")
        ;

        svg.append("rect")
            .attr("x", width + margin.left + 1)
            .attr("y",  margin.top + 20)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#4682b4")
            .style("stroke", "grey");

        svg.append("text")
            .attr("x", width + margin.left + 13)
            .attr("y",  margin.top + 27)
            .attr("text-anchor", "start")
            .text("Y")
        ;

        svg.append("text")
            .attr("x", width + margin.left + 13)
            .attr("y",  margin.top + 47)
            .attr("text-anchor", "start")
            .text("X")
        ;


        svg.append("rect")
            .attr("x", width + margin.left + 1)
            .attr("y",  margin.top + 40)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#001c9c")
            .style("stroke", "grey");*/

        addZoomDouble(svg,updateHisto1DStack);

    });
}


/***********************************************************************************************************/


function updateHisto1DStack(svg){


    svg.chartOutput.attr("transform","matrix(" + (svg.scalex*svg.scale) + ", 0, 0, " + (svg.scaley*svg.scale) + ", " + svg.translate[0] + "," + svg.translate[1] + ")" );

    svg.chartInput.attr("transform","matrix(" + (svg.scalex*svg.scale) + ", 0, 0, " + (svg.scaley*svg.scale) + ", " + svg.translate[0] + "," + (svg.translate[1] - (svg.scaley*svg.scale-1)*svg.margin.zero) + ")" );


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
            return;
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



    // constant
    var width = svg.x.range()[1]-svg.x.range()[0];
    var heightNM = svg.height - svg.margin.zero;

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
                    svg.translate[0] = Math.min(0, Math.max(e.translate[0],width - e.scale*svg.scalex*width ));
                    svg.translate[1] = Math.min(0, Math.max(e.translate[1],svg.height - e.scale*svg.scaley*heightNM - svg.margin.zero));


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

                    console.log("zoom " + svg.translate + " e.t " + e.translate);


                    //actualization of the translation vector with the scale change
                    svg.translate[0]*= xrel;

                    //actualization of the translation vector (translate) to the top left corner of our view within the standard x&y.range() frame
                    //If possible, the absolute location pointed by the cursor stay the same
                    //Since zoom.translate(translate) doesn't work immediately but at the end of all consecutive zoom actions,
                    //we can't rely on d3.event.translate for smooth zooming and have to separate zoom & translation
                    svg.translate[0] = Math.min(0, Math.max(svg.translate[0] - mouseCoord[0]*(xrel - 1),width - e.scale*svg.scalex*width ));

                    var oldMouse = mouseCoord[1] - svg.translate[1];
                    
                    var newMouse = oldMouse* yrel + Math.min(svg.margin.zero, Math.max(0,oldMouse - svg.heightOutput*svg.scale*lastScaley))*(1 - yrel);
                    svg.translate[1] = oldMouse - newMouse + svg.translate[1];
                    svg.translate[1] = Math.min(0, Math.max(svg.translate[1],svg.height - e.scale*svg.scaley*heightNM - svg.margin.zero));

                    console.log("newmouse :" + newMouse + " oldMouse :" + oldMouse);


                    svg.scale = e.scale;

                    console.log(" lastScalex " + lastScalex + " scalex " + svg.scalex + " lastScaley " + lastScaley + " scaley " + svg.scaley + " xrel " + xrel + " yrel " + yrel);
                }


                svg.zoom.translate(svg.translate);


                actTranslate[0] = -svg.translate[0]/(svg.scalex*e.scale);
                actTranslate[1] = -svg.translate[1]/(svg.scaley*e.scale);


                //actualization of the current (newX&Y) scales domains
                svg.newX.domain([ svg.x.invert(actTranslate[0]), svg.x.invert(actTranslate[0] + width/(e.scale*svg.scalex)) ]);

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
                mouseCoord[1] = Math.min(Math.max(mouseCoord[1],svg.yOutput.range()[1]),svg.yInput.range()[1]);

                svg.selec.attr("x", Math.min(mouseCoord[0],startCoord[0]))
                    .attr("y", Math.min(mouseCoord[1],startCoord[1]))
                    .attr("width",  Math.abs(mouseCoord[0] - startCoord[0]))
                    .attr("height", Math.abs(mouseCoord[1] - startCoord[1]));
            }


        })

        .on("zoomstart",function () {
            console.log("acttransl " + -svg.translate[1]/(svg.scaley*svg.scale));
            if(isShiftKeyDown){
                console.log("key is down start");
                startCoord = d3.mouse(svg.frame.node());
                startCoord[0] = Math.min(Math.max(startCoord[0],svg.x.range()[0]),svg.x.range()[1]);
                startCoord[1] = Math.min(Math.max(startCoord[1],svg.yOutput.range()[1]),svg.yInput.range()[1]);

                svg.style("cursor","crosshair");
            }

        })
        .on("zoomend", function () {

            if(!isNaN(startCoord[0])){


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
                    svg.scalex = width*svg.scale*svg.scalex/sqwidth;

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