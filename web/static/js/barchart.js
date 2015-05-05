//make filter chosen style
$(".filter").chosen();

var collapse_template = Handlebars.compile(
  $("#collapse-template").html()
);

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

var svg_axis = d3.select("#x-axis")
    .attr("width", width + margin.left + margin.right)
    .attr("height", margin.top)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//initialize data
var data = create_bar_chart_data(raw_data);

//increment number of items in category
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


// count categories in raw data, use filters if selected
function create_bar_chart_data(raw_data, filters) {
  var before = {};
  var after = {};
  raw_data.forEach(function (d) {
    if (filters){
      if(filters.indexOf(d.grade) > -1 || filters.indexOf(d.district) > -1 ){
        update_counter(before, d.before);
        update_counter(after, d.after);
      }
    }
    else{
      update_counter(before, d.before);
      update_counter(after, d.after);
    }
  })

  // create sub_category associative arrays
  var names = d3.set(d3.merge([d3.keys(before), d3.keys(after)]))
  var sub_categories = [];
  names.forEach(function (name) {
    var d = {
      name: name,
      main_category: categories[name],
      before: -before[name] || 0,
      after: after[name] || 0,
    }
    // d.before is already negative
    d.change = d.after + d.before;

    sub_categories.push(d);
  });

  // create main_category associative arrays
  var main_category_names = d3.set(d3.values(categories));
  var main_categories = [];
  main_category_names.forEach(function(main_category_name, index, ar){
    var d = {
      main_category: main_category_name,
      before: 0,
      after: 0,
      sub_categories: [],
    }

    sub_categories.forEach(function(sub_category){
      if(sub_category.main_category == d.main_category){
        d.before += sub_category.before
        d.after += sub_category.after
        d.sub_categories.push(sub_category)
      }
    })
    // d.before is already negative
    d.change = d.after + d.before;
    main_categories.push(d);
  })
  return main_categories;
}


// configure the xAxis
x.domain([
  d3.min(data, function (d) {return d.before}),
  d3.max(data, function (d) {return d.after})
]).nice();

var xLabelHeight = "-27";
svg_axis.append("g")
    .attr("class", "x axis")
    .call(xAxis);
svg_axis.append("text")
    .attr("class", "xLabel")
    .attr("x", "-7")
    .attr("y", xLabelHeight)
    .text("Before");
svg_axis.append("text")
    .attr("class", "xLabel")
    .attr("x", width - 20)
    .attr("y", xLabelHeight)
    .text("After");


function add_wrappers (main_category, index){
      var wrapper = d3.select('#barchart')
          .append('div')
          .attr("style", "width:" +( width + 20 )+ "px;")
      main_category.index = index + 1;
      wrapper.html(collapse_template(main_category));
}


function add_bars (category, index) {
      //add main category bars
      var bar_svg = d3.select("#main-category-" + (index + 1)).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", "40")
    	    .attr('class', 'bar-svg')

      var bar_main = bar_svg.append('g')
        	.attr('transform', 'translate(' + margin.left + ',' + 0 + ')')
        	.attr('width', width)
        	.attr('height', "40")
        	.attr('class', 'bar')

      bar_main.append("rect")
          .attr("x", function(d) { return x(category.before); })
          .attr("y", "0")
          .attr("width", function(d) { return x(category.after) - x(category.before)})
          .attr("height", "40");
      bar_main.append("text")
          .attr("class", "backer")
          .attr("x", function(d) { return x(0) })
          .attr("y", "20")
          .attr("dy", "0.35em")
          .text(function (d) {return category.main_category});
      bar_main.append("text")
          .attr("x", function(d) { return x(0) })
          .attr("y", "20")
          .attr("dy", "0.35em")
          .text(function (d) {return category.main_category});

      // add subcategory bars
      var subcategories = category.sub_categories;
      var sub_bars_svg = d3.select("#subcategory-" + (index + 1)).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", (30*subcategories.length))
          .attr('class', 'bar-svg')

      subcategories.forEach(
        function (d, index) {
          console.log(d.name +": Before:"+d.before+" After:" + d.after);
          var sub_bar_main = sub_bars_svg.append('g')
              .attr('transform', 'translate(' + margin.left + ',' + 30*index + ')')
              .attr('width', width)
              .attr('height', 30)
              .attr('class', 'sub-bar')

          sub_bar_main.append("rect")
              .attr("x", function() { return x(d.before); })
              .attr("y", 0)
              .attr("width", function() { return x(d.after) - x(d.before)})
              .attr("height", "25");
          sub_bar_main.append("text")
              .attr("class", "backer")
              .attr("x", function() { return x(0) })
              .attr("y", "12")
              .attr("dy", "0.35em")
              .text(function () {return d.name});
          sub_bar_main.append("text")
              .attr("x", function() { return x(0) })
              .attr("y", "12")
              .attr("dy", "0.35em")
              .text(function () {return d.name});
      });
}

function render_bars(){
  d3.selectAll(".bar-svg").remove();
  data.forEach(add_bars);
}

// render bars and order data  when we first load the page
order_data();
data.forEach(add_wrappers);
render_bars();
//
//data.forEach(draw_bars);

// on filter change: get filter choices, update data, order data
$(".filter").change(function(event){
    var filter_choices = [];
    $(".filter option:selected" ).each(function(i, obj){
      filter_choices.push(obj.innerText);
    })
    if (filter_choices.length == 0){
      data = create_bar_chart_data(raw_data);
    }else{
      data = create_bar_chart_data(raw_data, filter_choices);
    }

    order_data();
    render_bars();
});

// ordering radio button clicked
$("#before-change-after .btn-primary").on("click", ordering_before_change_after);
$("#increasing-decreasing .btn-primary").on("click", ordering_increasing_decreasing);

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
    var before_change_after = before_change_after || $.trim($("#before-change-after label.active").text());
    var increasing_decreasing = increasing_decreasing || $.trim($("#increasing-decreasing label.active").text());

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

//DATA FORMAT
//
// data = [
//   {
//     main_category: 'category1',
//     before:-5
//     after:10
//     change:5
//     sub_categories: [
//       {
//         name: 'this is a subcategory'
//         before: -5
//         after: 3
//       },
//       {
//         name: 'this is a subcategory2'
//         before: 0
//         after: 7
//       },
//     ]
//   }
// ]
