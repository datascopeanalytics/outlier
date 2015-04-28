
$(".filter").chosen();

var margin = {top: 50, right: 10, bottom: 10, left: 10},
    width = 960 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width])

var y = d3.scale.ordinal()
    .rangeRoundBands([0, height], .2);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top")
    .tickFormat(function (d){
        if (d < 0){ return (d * -1);}
        return d;
        })

var svg = d3.select("#barchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var data = create_bar_chart_data(raw_data);

function update_counter(counter, values) {
  values.forEach(function (value) {
    if(value in counter) {
      counter[value] += 1;
    }
    else {
      counter[value] = 1;
    }
  })
}

function create_bar_chart_data(raw_data) {
  var before = {};
  var after = {};
  raw_data.forEach(function (d) {
    update_counter(before, d.before);
    update_counter(after, d.after);
  })

  // get all of the names for the before and after counters
  var names = d3.set(d3.merge([
    d3.keys(before), d3.keys(after)
  ]))

  // assemble into an easy to use
  var data = [];
  names.forEach(function (name) {
    var d = {
      name: name,
      before: -before[name] || 0,
      after: after[name] || 0
    }

    // d.before is already negative
    d.change = d.after + d.before;
    data.push(d);
  });
  return data;
}

x.domain([
  d3.min(data, function (d) {return d.before}),
  d3.max(data, function (d) {return d.after})
]).nice();

// configure the axes
var xLabelHeight = "-27";
svg.append("g")
    .attr("class", "x axis")
    .call(xAxis);
svg.append("g")
    .attr("class", "y axis")
  .append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y2", height);
svg.append("text")
    .attr("class", "xLabel")
    .attr("x", "-7")
    .attr("y", xLabelHeight)
    .text("Before");
svg.append("text")
    .attr("class", "xLabel")
    .attr("x", width - 20)
    .attr("y", xLabelHeight)
    .text("After");


// render something when we first load the page and also when any of the
// buttons are pushed
render_bars();
$("#before-change-after .btn-primary").on("click", ordering_before_change_after);
$("#increasing-decreasing .btn-primary").on("click", ordering_increasing_decreasing);

// redraw everything that should change dynamically
function render_bars () {

    y.domain(data.map(function(d) { return d.name; }));

    // remove everything
    svg.selectAll(".bar").remove();

    // add a bunch of g.bar elements
    svg.selectAll(".bar")
        .data(data)
      .enter().append("g")
        .attr("class", "bar");

    // add the rectangles
    svg.selectAll(".bar")
        .append("rect")
        .attr("x", function(d) { return x(d.before); })
        .attr("y", function(d) { return y(d.name); })
        .attr("width", function(d) { return x(d.after) - x(d.before)})
        .attr("height", y.rangeBand());

    // add the labels
    svg.selectAll(".bar")
        .append("text")
        .attr("class", "backer")
        .attr("x", function(d) { return x(0) })
        .attr("y", function(d) { return y(d.name) + 0.5*y.rangeBand(); })
        .attr("dy", "0.35em")
        .text(function (d) {return d.name});
    svg.selectAll(".bar")
        .append("text")
        .attr("x", function(d) { return x(0) })
        .attr("y", function(d) { return y(d.name) + 0.5*y.rangeBand(); })
        .attr("dy", "0.35em")
        .text(function (d) {return d.name});
}


function ordering_before_change_after(event) {
    var before_change_after = $.trim($(this).text());
    var increasing_decreasing = $.trim($("#increasing-decreasing label.active").text());
    order_data(before_change_after, increasing_decreasing);
    render_bars();
}

function ordering_increasing_decreasing(event) {
    var before_change_after = $.trim($("#before-change-after label.active").text());
    var increasing_decreasing = $.trim($(this).text());
    order_data(before_change_after, increasing_decreasing);
    render_bars();
}

function order_data(before_change_after, increasing_decreasing) {
    if (increasing_decreasing === "increasing") {
        if (before_change_after === "before") {
            var comparator = d3.descending;
        }
        else {
            var comparator = d3.ascending;
        }
    }
    else {
        if (before_change_after === "before") {
            var comparator = d3.ascending;
        }
        else {
            var comparator = d3.descending;
        }
    }
    data.sort(function (a, b) {
        var c = comparator(a[before_change_after], b[before_change_after]);
        if (c===0) {
            return comparator(a.name, b.name);
        }
        return c;
    });
}
