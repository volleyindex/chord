// Create the SVG area
const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", 440)
    .attr("height", 440)
    .append("g")
    .attr("transform", "translate(220,220)");

// Input data: unweighted matrix
const unweightedMatrix =  [[0, 0, 0, 3, 0, 0, 2, 2, 3, 1, 1], [3, 0, 3, 3, 0, 0, 1, 3, 3, 0, 3], [0, 0, 0, 3, 0, 1, 1, 3, 1, 1, 3], [2, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1], [0, 3, 0, 3, 0, 3, 1, 2, 3, 3, 0], [3, 0, 3, 3, 0, 0, 3, 2, 3, 3, 0], [3, 3, 3, 0, 3, 1, 0, 0, 3, 3, 3], [3, 0, 1, 3, 3, 3, 0, 0, 0, 2, 3], [0, 0, 3, 0, 0, 0, 0, 0, 0, 2, 0], [3, 0, 3, 3, 2, 0, 0, 3, 3, 0, 0], [3, 0, 0, 3, 3, 0, 1, 1, 3, 0, 0]];

// Weighted matrix
const weightedMatrix = [[0, 1, 0, 10, 0, 1, 5, 5, 11, 3, 3], [11, 0, 11, 11, 1, 0, 3, 11, 11, 0, 11], [0, 1, 0, 10, 0, 3, 3, 10, 3, 3, 11], [5, 1, 3, 0, 1, 1, 0, 3, 0, 3, 3], [0, 11, 0, 11, 0, 11, 3, 5, 11, 10, 1], [11, 0, 10, 11, 1, 0, 10, 5, 11, 11, 0], [10, 10, 10, 0, 10, 3, 0, 0, 11, 11, 10], [10, 1, 3, 10, 10, 10, 0, 0, 0, 5, 10], [1, 1, 10, 0, 1, 1, 1, 0, 0, 5, 1], [10, 0, 10, 10, 5, 1, 1, 10, 10, 0, 0], [10, 1, 1, 10, 11, 0, 3, 3, 11, 0, 0]]

const teams = ['CSUN', 'Cal Poly', 'Cal State Bakersfield', 'Cal State Fullerton', "Hawai'i", 'Long Beach State', 'UC Davis', 'UC Irvine', 'UC Riverside', 'UC San Diego', 'UC Santa Barbara'];
const colors = ['#ce1126', '#154734', '#003594', '#ff7900', "#000000", '#ecaa00', '#b3a369', '#0c2340', '#0073d4', '#adb7b9', '#30007f']; // Different colors for each node

let currentMatrix = unweightedMatrix; // Start with unweighted matrix
const res = d3.chord()
    .padAngle(0.05)
    .sortSubgroups(d3.descending)(currentMatrix);

const tooltip = d3.select("#tooltip");
let showPathTooltips = true; // Flag to control path tooltips visibility
let weightedView = false; // Flag to control view type
let useWinnerColor = true; // Flag for winner color toggle
let isFirstLoad = true; // Flag to track first load
let useAnimate = false; // Flag for animate option

function drawChords(filterIndex = null, useWinnerColor = true) {
    // Clear previous drawings except the legend
    svg.selectAll(".arc").remove();
    svg.selectAll(".ribbon").remove();

    // Update the chord diagram based on the current matrix
    const res = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending)(currentMatrix);

    // Draw groups (arcs)
    const arcs = svg
        .datum(res)
        .append("g")
        .selectAll("g")
        .data(d => d.groups)
        .join("g")
        .append("path")
        .attr("d", d3.arc()
            .innerRadius(200)
            .outerRadius(210))
        .attr("class", "arc")
        .style("fill", (d, i) => colors[i]); // Apply color based on index

    // Animate arcs on first load
    if (isFirstLoad) {
        arcs.style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1);
    }
    arcs.on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                   .html(`<strong>${teams[d.index]}</strong>`)
                   .style("left", (event.pageX + 5) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        })
        .on("click", function(event, d) {
            drawChords(d.index, useWinnerColor); // Draw only connected to clicked node
        });

    // Draw ribbons (links)
    const ribbons = svg
        .datum(res)
        .append("g")
        .selectAll("path")
        .data(d => {
            if (filterIndex === null) {
                return d; // Return all ribbons if no filter
            }
            return d.filter(chord => chord.source.index === filterIndex || chord.target.index === filterIndex);
        })
        .join("path")
        .attr("d", d3.ribbon()
            .radius(200))
        .attr("class", "ribbon")
        .style("fill", d => {
            if (useWinnerColor) {
                // Determine the color based on the greater value
                const sourceValue = currentMatrix[d.source.index][d.target.index];
                const targetValue = currentMatrix[d.target.index][d.source.index];
                return sourceValue >= targetValue ? colors[d.source.index] : colors[d.target.index];
            } else {
                return "#a2c9d8"; // Default color when winner color is off
            }
        });

    // Animate ribbons on first load
    if (isFirstLoad | useAnimate) {
        ribbons.style("opacity", 0)
               .transition()
               .duration(1000)
               .delay((d, i) => (Math.floor(Math.random() * 50))*80+(isFirstLoad?1000:0)) // Stagger the animation
               .style("opacity", 0.7);
        
        isFirstLoad = false; // Set the flag to false after first load
    }else{
	    ribbons.style("opacity", 0.7);
    }

    ribbons.on("mouseover", function(event, d) {
            if (showPathTooltips) {
                const sourceName = teams[d.source.index];
                const targetName = teams[d.target.index];
                const value = unweightedMatrix[d.source.index][d.target.index]; // Always show unweighted value
                tooltip.style("display", "block")
                       .html(`<strong>${sourceName} ${value} - ${unweightedMatrix[d.target.index][d.source.index]} ${targetName}</strong>`)
                       .style("left", (event.pageX + 5) + "px")
                       .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });
}

// Draw the legend only once
function drawLegend() {
    const legend = d3.select("#legend")
        .selectAll(".legend-item")
        .data(teams)
        .join("div")
        .attr("class", "legend-item")
        .on("click", (event, d) => {
            const index = teams.indexOf(d);
            drawChords(index, useWinnerColor); // Draw only connected to the clicked legend item
        });

    legend.append("div")
        .attr("class", "legend-color")
        .style("background-color", (d, i) => colors[i]);

    legend.append("span")
        .text(d => d);
}

// Initial draw
drawChords();
drawLegend();

// Button event listener for "Show All"
document.getElementById("show-all").addEventListener("click", () => drawChords());

// Button event listener for toggling path tooltips
document.getElementById("toggle-tooltip").addEventListener("click", () => {
    showPathTooltips = !showPathTooltips; // Toggle the flag
    const button = document.getElementById("toggle-tooltip");
    button.textContent = `Tooltip: ${showPathTooltips ? "On" : "Off"}`; // Update button text
});

// Button event listener for toggling weighted view
document.getElementById("toggle-weighted").addEventListener("click", () => {
    weightedView = !weightedView; // Toggle the flag
    currentMatrix = weightedView ? weightedMatrix : unweightedMatrix; // Switch matrix
    const button = document.getElementById("toggle-weighted");
    button.textContent = `Toggle Weighted: ${weightedView ? "On" : "Off"}`; // Update button text
    drawChords(); // Redraw the chords
});

// Button event listener for toggling winner color
document.getElementById("toggle-winner-color").addEventListener("click", () => {
    useWinnerColor = !useWinnerColor; // Toggle the flag
    const button = document.getElementById("toggle-winner-color");
    button.textContent = `Use Winner Color: ${useWinnerColor ? "On" : "Off"}`; // Update button text
    drawChords(null, useWinnerColor); // Redraw the chords with updated color settings
});

// Button event listener for toggling animate
document.getElementById("toggle-animate").addEventListener("click", () => {
    useAnimate = !useAnimate; // Toggle the flag
    const button = document.getElementById("toggle-animate");
    button.textContent = `Animate: ${useAnimate ? "On" : "Off"}`; // Update button text
});
