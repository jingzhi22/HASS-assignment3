// The svg
const svg = d3.select("svg");

// Map and projection
const projection = d3.geoMercator()
    .center([103.95,1.29])               // GPS of location to zoom on
    .scale(70000)                       // This is like the zoom

// Load data
Promise.all([
d3.json("./subzone-boundary.geojson"),
d3.csv("./data.csv")
]).then(function (initialize) {

    let boundary = initialize[0]
    let town = initialize[1]

    // Function to calculate center based on average of list
    let arrAvg = arr => arr.reduce((a,b) => a + b,0) / arr.length

    // Function to remap av ppsm into a radius
    function map_range(value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    }

    // calculate center position of each town
    for (let i = 0; i < town.length; i++)
    {
        var boundaryIndex = boundary.features.findIndex(function(feature) {
            return feature.properties.Description.includes(town[i].name)
            });
        var townCoordinates = boundary.features[boundaryIndex].geometry.coordinates[0];
        var lat = [];
        var lon = [];
        for(var j=0; j<townCoordinates.length; j++){
            lat.push(townCoordinates[j][1]);
            lon.push(townCoordinates[j][0]);
        }
        var latAvg = arrAvg(lat);
        var lonAvg = arrAvg(lon);
        var center = projection([lonAvg,latAvg])
        town[i]['lon'] = center[0]
        town[i]['lat'] = center[1]
    }

    // define tooltip
    var Tooltip = d3.select("body").append("div")
        .attr("class", "Tooltip")
        .style("opacity", 0);
        
    // Draw the singapore map
    svg.append("g")
        .selectAll("path")
        .data(boundary.features)
        .join("path")
        .attr("fill", "#bbbbbb")
        .attr("d", d3.geoPath().projection(projection))
        .attr("id", function(d) { return d.properties.PLN_AREA_N; })
        .attr("class","Town")
        .style("stroke", "#888888")
        .style("stroke-width", 1)
        .style("opacity", 1)
    
    let mouseOver = function(event, d){
        Tooltip.transition()
            .style("opacity", .9);
        Tooltip.html(
            d.name + "<br/>" +
            "Av. PPM: $" + Math.round(d.av_ppsm) + "<br/>" +
            "Av. LC: " + Math.round(d.av_lease_commence_date)
            )
        .style("left", (event.pageX + 30) + "px")
        .style("top", (event.pageY - 20) + "px");
    }

    let mouseLeave = function(d){
        Tooltip.transition()
            .style("opacity", 0);
    }
    
    // Add $$$
    svg.selectAll('g')
        .data(town)
        .enter()
        .append('text')
            .attr("x", function(d) { return d.lon; })
            .attr("y", function(d) { return d.lat; })
            .attr("opacity",1.0)
            .text("$")
            .attr("stroke-width","4px")
            .attr("font-size", function(d) { return map_range(d.av_ppsm,2000,10000,3,90); })
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
        .on("mouseover", mouseOver )
        .on("mouseleave", mouseLeave )
    
    // Print base data
    console.log(boundary);
    console.log(town);
})

svg.append('text')
.attr("x","90%")
.attr("y","90%")
.text(
    "av. PPM: Average price per square meter of units sold after 2017"
    )