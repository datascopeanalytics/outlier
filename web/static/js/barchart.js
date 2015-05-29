//make filter chosen style
$(".filter").chosen();

var collapse_template = Handlebars.compile(
  $("#collapse-template").html()
);

var main_category_tooltip_template = Handlebars.compile(
    $("#main-category-tooltip-template").html()
);

var subcategory_tooltip_template = Handlebars.compile(
    $("#subcategory-tooltip-template").html()
);

var margin = {top: 20, right: 5, bottom: 5, left: 5},
    middle = 95,
    width = 805 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var xBefore = d3.scale.linear()
    .range([0, width/2 - middle/2 - margin.left])

var xAfter = d3.scale.linear()
    .range([0, width/2 - middle/2 - margin.right])

var xAxisBefore = d3.svg.axis()
    .scale(xBefore)
    .orient("top")
    .ticks(8)
    .tickFormat(function (d){
        if (d < 0){ return (d * -1);}
          return d;
        })

var xAxisAfter = d3.svg.axis()
    .scale(xAfter)
    .orient("top")
    .ticks(8)
    .tickFormat(function (d){
        if (d < 0){ return (d * -1);}
          return d;
        })

var svg_axis_before = d3.select("#x-axis-before")
    .attr("width", width/2 + middle/2)
    .attr("height", margin.top)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var svg_axis_after = d3.select("#x-axis-after")
    .attr("width", width/2 + middle/2)
    .attr("height", margin.top)
    .attr("style","float:right")
  .append("g")
    .attr("transform", "translate(" + middle + "," + margin.top + ")");

//initialize data
var data = create_bar_chart_data(raw_data);

//increment number of items in category
function update_counter(sub_category_counter, category_counter, values) {
  current_main_categories = []
  values.forEach(function (value) {

    //count sub_cateogries
    if(value in sub_category_counter) {
      sub_category_counter[value] += 1;
    }
    else {
      sub_category_counter[value] = 1;
    }

    //add one main_category for each response
    main_category = categories[value].main_category;
    if((current_main_categories.indexOf(main_category,0))<0){
      current_main_categories.push(main_category);
      console.log(current_main_categories);
      if(main_category in category_counter){
        category_counter[main_category] += 1;
      }
      else {
        category_counter[main_category] = 1;
      }
    }
  })
}

// count categories in raw data, use filters if selected
function create_bar_chart_data(raw_data, filters) {
  var sub_category_before = {};
  var sub_category_after = {};
  var main_categories_before = {};
  var main_categories_after = {};

  raw_data.forEach(function (d) {
    if (filters){
      if(filters.indexOf(d.grade) > -1 || filters.indexOf(d.district) > -1 ){
        update_counter(sub_category_before, main_categories_before, d.before);
        update_counter(sub_category_after, main_categories_after, d.after);
      }
    }
    else{
      update_counter(sub_category_before,main_categories_before, d.before);
      update_counter(sub_category_after, main_categories_after, d.after);
    }
  })

  // create sub_category groups
  var names = d3.set(d3.merge([d3.keys(sub_category_before), d3.keys(sub_category_after)]))
  var sub_categories = [];
  names.forEach(function (sub_category) {
    var d = {
      name: sub_category,
      main_category: categories[sub_category].main_category,
      display_name: categories[sub_category].display_name,
      description: categories[sub_category].description,
      before: -sub_category_before[sub_category] || 0,
      after: sub_category_after[sub_category] || 0,
    }

    // d.before is already negative
    d.change = d.after + d.before;

    sub_categories.push(d);
  });

  // add subcategories to main category groups
  var main_category_names = d3.set(d3.merge([d3.keys(main_categories_before), d3.keys(main_categories_after)]))
  var main_categories = [];
  main_category_names.forEach(function(main_category_name){
    var d = {
      main_category: main_category_name,
      before: -main_categories_before[main_category_name] || 0,
      after: main_categories_after[main_category_name] || 0,
      sub_categories: [],
    }

    sub_categories.forEach(function(sub_category){
      if(sub_category.main_category == d.main_category){
        d.sub_categories.push(sub_category)
      }
    })
    // d.before is already negative
    d.change = d.after + d.before;

    // add main category if the count isn't zero
    if(d.before != 0 || d.after != 0){
      main_categories.push(d);
    }
  })
  return main_categories;
}


// configure the xAxis
var beforeMax = d3.min(data, function (d) {return d.before});
var afterMax = d3.max(data, function (d) {return d.after});
var totalMax = (- beforeMax) > afterMax ? (- beforeMax):afterMax;
xBefore.domain([-totalMax,0]).nice();
xAfter.domain([0,totalMax]).nice();

var xLabelHeight = "-27";
svg_axis_before.append("g")
    .attr("class", "x axis")
    .call(xAxisBefore);
svg_axis_after.append("g")
    .attr("class", "x axis")
    .call(xAxisAfter);


function add_wrappers (main_category, index){
      var wrapper = d3.select('#barchart')
          .append('div')
          .attr("style", "width:" +( width + 20 )+ "px;")
      main_category.index = index + 1;
      wrapper.html(collapse_template(main_category));
}

function add_bars (category, index) {
      //add main category svgs
      var bar_svg = d3.select("#main-category-" + (index + 1)).append("svg")
          .attr("width", width + middle + margin.left + margin.right)
          .attr("height", "40")
    	    .attr('class', 'bar-svg')

      //prepare the tooltip for the main categories
      var main_tip = d3.tip()
          .attr('class', 'd3-tip')
          .direction('n')
          .offset([-15,0])
          .html(function(d) {
              return main_category_tooltip_template(d);
          });
      bar_svg.call(main_tip);

      //append g's, bars, and text to main category svgs
      var bar_main = bar_svg.append('g')
        	.attr('transform', 'translate(' + margin.left + ',' + 0 + ')')
        	.attr('width', width)
        	.attr('height', "40")
        	.attr('class', 'bar')
      bar_main.append("rect")
          .attr("x", function(d) { return xBefore(category.before); })
          .attr("y", "0")
          .attr("width", function(d) { return xBefore(0) - xBefore(category.before)})
          .attr("height", "40")
          .attr("fill","#008080");
      bar_main.append("rect")
          .attr("x", function(d) { return xAfter(0); })
          .attr("y", "0")
          .attr("width", function(d) { return xAfter(category.after) - xAfter(0)})
          .attr('transform', 'translate(' + (width/2 + middle/2 + middle) + ',' + 0 + ')')
          .attr("height", "40")
          .attr("fill","#008080");
      bar_main.append("text")
          .attr("class", "backer")
          .attr("x", width/2 + middle/2)
          .attr("y", "20")
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(function (d) {return category.main_category});
      bar_main.append("text")
          .attr("x", width/2 + middle/2)
          .attr("y", "20")
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(function (d) {return category.main_category});

      //add tooltip to main bar svgs on mouseover
      bar_svg.selectAll("g")
          .on('mouseover', function () {
              var tip = {}
              tip.name = category.main_category
              tip.before = -category.before;
              tip.after = category.after;
              main_tip.show(tip)
              d3.select(this).attr('stroke-width', 2)
          })
          .on('mouseout', function (d) {
              main_tip.hide(d);
              d3.select(this).attr('stroke-width', 0)
          });

      // add subcategory bars
      var subcategories = category.sub_categories;
      var sub_bars_svg = d3.select("#subcategory-" + (index + 1)).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", (30*subcategories.length))
          .attr('class', 'bar-svg')

      //prepare tooltip for subcategory bars
      var sub_tip = d3.tip()
          .attr('class', 'd3-tip')
          .direction('n')
          .offset([-15,0])
          .html(function(d) {
              return subcategory_tooltip_template(d);
          });
      sub_bars_svg.call(sub_tip);

      //for each subcategory: add g's, bars, and text
      subcategories.forEach(
        function (d, index) {
          var sub_bar_main = sub_bars_svg.append('g')
              .attr('transform', 'translate(' + margin.left + ',' + 30*index + ')')
              .attr('width', width)
              .attr('height', 30)
              .attr('class', 'sub-bar')
          sub_bar_main.append("rect")
              .attr("x", function() { return xBefore(d.before); })
              .attr("y", 0)
              .attr("width", function() { return xBefore(0) - xBefore(d.before)})
              .attr("height", "25")
              .attr("fill","#c0392b");
          sub_bar_main.append("rect")
              .attr("x", function() { return xAfter(0); })
              .attr("y", 0)
              .attr("width", function() { return xAfter(d.after) - xAfter(0)})
              .attr('transform', 'translate(' + (width/2 + middle/2 + middle) + ',' + 0 + ')')
              .attr("height", "25")
              .attr("fill","#c0392b");
          sub_bar_main.append("text")
              .attr("class", "backer")
              .attr("x", width/2 + middle/2)
              .attr("y", "12")
              .attr("dy", "0.35em")
              .text(function () {return d.display_name});
          sub_bar_main.append("text")
              .attr("x", width/2 + middle/2)
              .attr("y", "12")
              .attr("dy", "0.35em")
              .text(function () {return d.display_name});

          //add tooltip to main bar svgs on mouseover
          sub_bar_main.selectAll("rect")
              .on('mouseover', function () {
                  var tip = {}
                  tip.name = d.display_name;
                  tip.before = -d.before;
                  tip.after = d.after;
                  tip.description = d.description;
                  sub_tip.show(tip)
                  d3.select(this).attr('stroke-width', 2)
              })
              .on('mouseout', function (d) {
                  sub_tip.hide(d);
                  d3.select(this).attr('stroke-width', 0)
              });
        sub_bar_main.selectAll("text")
            .on('mouseover', function () {
                var tip = {}
                tip.name = d.display_name;
                tip.before = -d.before;
                tip.after = d.after;
                tip.description = d.description;
                sub_tip.show(tip)
                d3.select(this).attr('stroke-width', 2)
            })
            .on('mouseout', function (d) {
                sub_tip.hide(d);
                d3.select(this).attr('stroke-width', 0)
            });
      });
}

function render_bars(){
  d3.selectAll(".panel-default").remove();
  data.forEach(add_wrappers);
  d3.selectAll(".bar-svg").remove();
  data.forEach(add_bars);
}

// render bars and order data  when we first load the page
order_data();
render_bars();

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
$("#before-change-after .btn-danger").on("click", ordering_before_change_after);
$("#increasing-decreasing .btn-danger").on("click", ordering_increasing_decreasing);

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

    data.forEach(function(category){
      category.sub_categories.sort(function (a, b) {
          var c = comparator(a[before_change_after], b[before_change_after]);
          if (c===0) {
              return comparator(a.name, b.name);
          }
          return c;
      });
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
