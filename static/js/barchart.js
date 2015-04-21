var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 960 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width])

var y = d3.scale.ordinal()
    .rangeRoundBands([0, height], .2);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top");

var svg = d3.select("#barchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var data = create_bar_chart_data(raw_data);
console.log(data)

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
    data.push({
      name: name,
      before: -before[name] || 0,
      after: after[name] || 0
    })
  });
  return data;
}

x.domain([
  d3.min(data, function (d) {return d.before}),
  d3.max(data, function (d) {return d.after})
]).nice();
y.domain(data.map(function(d) { return d.name; }));

svg.selectAll(".bar")
    .data(data)
  .enter().append("g")
    .attr("class", "bar");
svg.selectAll(".bar")
    .append("rect")
    .attr("x", function(d) { return x(d.before); })
    .attr("y", function(d) { return y(d.name); })
    .attr("width", function(d) { return x(d.after) - x(d.before)})
    .attr("height", y.rangeBand());
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

svg.append("g")
    .attr("class", "x axis")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
  .append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y2", height);
