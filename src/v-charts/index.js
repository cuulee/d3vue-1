export default {
  install: function(Vue) {
    Vue.prototype.$helpers = {
      chart: {
        d3: {},
        ds: {},
        /**
         * $helpers.chart.barChart
         * bind data to a bar graph.
         * @param {string} d3 - reference to d3 object.
         * @param {string} ds - dataset for the graph.
         * @param {Object} options - options for bar graph.
         * @param {string} options.selector - selector name to place the graph.
         * @param {string} options.metric - value you are measuring.
         * @param {string} options.dim - value you will be categorizing the data by.
         * @param {string} options.width - width of the chart.
         * @param {string} options.height - height of the chart.
         * @param {string} options.title - title of the chart.
         */
        barChart: function(d3, ds, options) {
          var svg = this.init(d3, ds, options.selector);
          var offset = options.title ? 20 : 0;
          options.height = options.height - offset;
          var g = svg.selectAll("rect")
            .data(this.ds);

          var maxVal = Math.max.apply(Math, this.ds.map(function(o) {
            return o[options.metric];
          }));

          var yScale = this.d3.scaleLinear()
            .domain([0, maxVal])
            .range([options.height, 0]);

          var yAxis = this.d3.axisLeft()
            .scale(yScale);

          var xScale = this.initOrdinalScale(options.dim, options.width, offset);
          var xAxis = this.d3.axisBottom()
            .scale(xScale)

          svg.selectAll("g").remove();
          if (options.title) this.addTitle(options.title, svg, options.width);

          g.enter()
            .append("rect")
            .merge(g)
            .attr('class', 'bar')
            .attr("width", (d, i) => {
              return (options.width / this.ds.length) - 1
            })
            .attr("height", d => {
              return options.height - yScale(d[options.metric])
            })
            .attr("x", (d, i) => {
              return (i * (options.width / this.ds.length)) + 60
            })
            .attr("y", d => {
              return yScale(d[options.metric]);
            })
            .on("mouseover", d => {
              this.addTooltip(d, svg, options.width - offset, 10 )
            })
            .on("mouseout", d => {
              this.removeTooltip(svg);
            })
            .attr("transform", "translate(0,"+offset+")");

          this.drawAxis(options.height, svg, offset, xAxis, yAxis);
          g.exit().remove();
        },

        /**
         * $helpers.chart.lineChart
         * bind data to a line graph.
         * @param {string} d3 - reference to d3 object.
         * @param {string} ds - dataset for the graph.
         * @param {Object} options - options for bar graph.
         * @param {string} options.selector - selector name to place the graph.
         * @param {string} options.metric - value you are measuring.
         * @param {string} options.dim - value you will be categorizing the data by.
         * @param {string} options.width - width of the chart.
         * @param {string} options.height - height of the chart.
         * @param {string} options.title - title of the chart.
         */
        lineChart: function(d3, ds, options) {
          var svg = this.init(d3, ds, options.selector);
          var offset = 0;

          var maxVal = Math.max.apply(Math, this.ds.map(function(o) {
            return o[options.metric];
          }));

          var minVal = Math.min.apply(Math, this.ds.map(function(o) {
            return o[options.metric];
          }));

          var yScale = this.d3.scaleLinear()
            .domain([minVal, maxVal])
            .range([options.height, 0]);

          var yAxis = this.d3.axisLeft()
            .scale(yScale);

          var xScale = this.initOrdinalScale(options.dim, options.width);
          var xAxis = this.d3.axisBottom()
            .scale(xScale)

          var lineFunction = this.d3.line()
            .x(function(d, i) { return xScale(d[options.dim]) + 60; })
            .y(function(d) { return yScale(d[options.metric]); })

          svg.selectAll("g").remove();
          svg.selectAll("path").remove();

          svg.append("path")
            .datum(this.ds)
            .attr("fill", "none")
            .attr("stroke", "#ffab00")
            .attr("stroke-width", 3)
            .attr("d", lineFunction)

          this.drawAxis(options.height, svg, offset, xAxis, yAxis);

          svg.exit().remove();
        },
        /**
         * $helpers.chart.pieChart
         * bind data to a pie chart.
         * @param {string} d3 - reference to d3 object.
         * @param {string} ds - dataset for the graph.
         * @param {Object} options - options for bar graph.
         * @param {string} options.selector - selector name to place the graph.
         * @param {string} options.metric - value you are measuring.
         * @param {string} options.dim - value you will be categorizing the data by.
         * @param {string} options.width - width of the chart.
         * @param {string} options.height - height of the chart.
         * @param {string} options.title - title of the chart.
         */
        pieChart: function(d3, ds, options) {
          var svg = this.init(d3, ds, options.selector);
          var offset = 0;
          var radius = options.height > options.width ? (options.width - options.width * 0.1) / 2 : (options.height - options.height * 0.1) / 2;

          var pie = this.d3.pie()
            .sort(null)
            .value(function(ds) {
              return ds[options.metric];
            });

          var path = this.d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(25);

          var arc = svg.selectAll(".arc")
              .data(pie(ds))

          var color = d3.scaleOrdinal()
            .range(["#4D4D4D", "#5DA5DA", "#FAA43A", "#60BD68", "#F17CB0",
              "#B2912F", "#B276B2", "#DECF3F", "#F15854"
            ])

          arc.enter()
            .append("g")
            .attr("transform", "translate(" + options.width / 2 + "," + options.height / 2 + ")")
            .append("path")
            .merge(arc)
            .attr("class", "arc")
            .attr("d", path)
            .attr("fill", function(d,i) {
              return color(i);
            })
            .on("mouseover", d => {
              this.addTooltip(d.data, svg, options.width - 20, 10 )
            })
            .on("mouseout", d => {
              this.removeTooltip(svg);
            });
            arc.exit().remove();

        },
        /* Helper Function */
        init: function(d3, ds, selector) {
          this.d3 = d3;
          this.ds = ds;
          return this.d3.select(selector)
        },

        initOrdinalScale: function(dim, width) {
          var domainArr = [];
          var rangeArr = [];

          this.ds.forEach((t) => {
            domainArr.push(t[dim])
          })
          this.ds.forEach((t, i) => {
            rangeArr.push(width * i / this.ds.length)
          })

          var xScale = this.d3.scaleOrdinal()
            .domain(domainArr)
            .range(rangeArr);
          return xScale;
        },

        drawAxis: function(height, svg, offset, xAxis, yAxis) {
          svg.append("g")
            .attr("transform", "translate(50,"+offset+")")
            .call(yAxis)
            ;

          svg.append("g")
            .attr("transform", "translate(70," + (height + offset + 5) + ")")
            .call(xAxis);
        },

        addTooltip: function(d, svg, x, y) {
          svg.append("text")
          .attr("x", x)
          .attr("y", y)
          .attr("class", "tt")
          .text(d.name + ": " + d.val);
        },

        removeTooltip: function(svg){
          svg.selectAll(".tt").remove();
        },

        addTitle: function(t, svg, w){
          svg.append("text")
          .attr("x", w / 2)
          .attr("text-anchor", "middle")
          .attr("y", 0)
          .text(t);
        }
      }
    }
  }
}
