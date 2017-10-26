import { h, Component } from "preact";
import * as styles from "./Joyplot.scss";
import * as d3 from "d3";
import { format } from "date-fns";

// Making these event listener function file scope so they unmount
// until I find a better way. Please help lol
var resizeJoyplot;

class Joyplot extends Component {
  constructor(props) {
    super(props);

    this.createChart = this.createChart.bind(this); // Bind to access within method
  }
  componentWillMount() {}

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate() {
    this.loadData();
  }

  createChart(error, dataFlat) {
    // Initial values
    let margin = { top: 60, right: 15, bottom: 70, left: 15 },
      width = parseInt(d3.select("." + styles.joyplot).style("width"), 10),
      joyplotHeight = 76,
      labelMargin = 105,
      spacing = 52,
      totalPlots = dataFlat.columns.length - 1,
      height = (totalPlots - 1) * spacing + joyplotHeight,
      joyplotFill = "rgba(0, 125, 153, 0.6)",
      guideFill = "rgba(92, 108, 112, 0.5)",
      guideTextFill = "rgba(92, 108, 122, 1.0)",
      lineWidth = 1,
      shapeRendering = "crispEdges", // auto | optimizeSpeed | crispEdges | geometricPrecision | inherit
      interestLineWidth = 40,
      fontSize = 15,
      guideFontSize = 11;

    // We are using Mike Bostock's margin conventions https://bl.ocks.org/mbostock/3019563
    width = width - margin.left - margin.right;

    // Due to a weird Firefox bug we need to sniff user agent
    // var chrome = navigator.userAgent.indexOf("Chrome") > -1;
    // var explorer = navigator.userAgent.indexOf("MSIE") > -1;
    // var firefox = navigator.userAgent.indexOf("Firefox") > -1;
    // var safari = navigator.userAgent.indexOf("Safari") > -1;
    // var camino = navigator.userAgent.indexOf("Camino") > -1;
    // var opera = navigator.userAgent.toLowerCase().indexOf("op") > -1;
    // if (chrome && safari) safari = false;
    // if (chrome && opera) chrome = false;

    // Set up a date parser
    var parseDate = d3.timeParse("%d/%m/%y");

    // set the range scales
    var xScale = d3.scaleTime().range([labelMargin, width]);
    var yScale = d3.scaleLinear().range([joyplotHeight, 0]);

    // define the chart area
    let area = d3
      .area()
      .x(d => {
        return xScale(d.Week);
      })
      .y0(yScale(0))
      .curve(d3.curveMonotoneX);

    // Set up some lines etc
    let baselineData = [[0, 0], [labelMargin - 5, 0]],
      interestLineData = [[0, 0], [interestLineWidth, 0]];

    let lineGenerator = d3.line();

    let baseline = lineGenerator(baselineData), // Underline labels
      interestline = lineGenerator(interestLineData); // Point out 100% search interest

    // Parse the dates to use full date format
    dataFlat.forEach(d => {
      d.Week = parseDate(d["Week"]);
    });

    // Convert the number strings to integers
    dataFlat.columns.forEach(d => {
      dataFlat.forEach(e => {
        if (d === "Week") return;
        e[d] = +e[d];
      });
    });

    let firstWeek = dataFlat[0].Week,
      lastWeek = dataFlat[dataFlat.length - 1].Week;

    // Grab out containing div for DOM operations
    const div = d3.select("." + styles.root);

    // Draw the chart
    var svg = d3
      .select("." + styles.joyplot)
      // .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    xScale.domain(
      d3.extent(dataFlat, function(d) {
        return d.Week;
      })
    );

    yScale.domain([
      -0.5, // Keep the baseline
      d3.max(dataFlat, function(d) {
        // Or just set to 100
        return d["Sydney siege"];
      })
    ]);

    // Draw some guides up top
    // 100% search interest
    const searchInterest = svg
      .append("g")
      .attr(
        "transform",
        "translate(" + (labelMargin - interestLineWidth / 2 + 4) + ", 0)"
      );

    searchInterest
      .append("path")
      .attr("d", interestline)
      .attr("stroke", guideFill)
      .attr("stroke-width", lineWidth + "px")
      .attr("fill", "none")
      .attr("shape-rendering", shapeRendering);

    const searchInterestText = searchInterest
      .append("text")
      .attr("fill", guideTextFill)
      .attr("font-size", guideFontSize)
      .attr("text-anchor", "end");

    searchInterestText
      .append("tspan")
      .text("100% search")
      .attr("x", -5);

    searchInterestText
      .append("tspan")
      .text("interest")
      .attr("x", -5)
      .attr("y", 13);

    // Time periods
    let timeLineYPos = joyplotHeight * 0.4;

    let timeLine = svg
      .append("line")
      .attr("x1", labelMargin)
      .attr("y1", timeLineYPos)
      .attr("x2", width)
      .attr("y2", timeLineYPos)
      .attr("stroke", guideFill)
      .attr("stroke-width", lineWidth + "px")
      .attr("fill", "none")
      .attr("shape-rendering", shapeRendering);

    // Left boundary line
    svg
      .append("line")
      .attr("x1", labelMargin)
      .attr("y1", timeLineYPos - 5.5)
      .attr("x2", labelMargin)
      .attr("y2", timeLineYPos + 5.5)
      .attr("stroke", guideFill)
      .attr("stroke-width", lineWidth + "px")
      .attr("fill", "none")
      .attr("shape-rendering", shapeRendering);

    // Right moving boundary line - resize below
    let timeLineRightBoundary = svg
      .append("line")
      .attr("x1", width)
      .attr("y1", timeLineYPos - 5.5)
      .attr("x2", width)
      .attr("y2", timeLineYPos + 5.5)
      .attr("stroke", guideFill)
      .attr("stroke-width", lineWidth + "px")
      .attr("fill", "none")
      .attr("shape-rendering", shapeRendering);

    // Timeline text
    let timeLineTextLeft = div
      .append("span")
      .text(format(firstWeek, "MMM D, YYYY"))
      .style("position", "absolute")
      .style("top", timeLineYPos + margin.top - guideFontSize * 0.6 + "px")
      .style("left", labelMargin + width * 0.05 + "px")
      .style("color", guideTextFill)
      .style("font-size", guideFontSize + "px")
      .style("background-color", "#f9f9f9")
      .style("padding", "0 4px 0 4px");

    let timeLineTextRight = div
      .append("span")
      .text(format(lastWeek, "MMM D, YYYY"))
      .style("position", "absolute")
      .style("top", timeLineYPos + margin.top - guideFontSize * 0.6 + "px")
      .style("right", width * 0.05 + "px")
      .style("color", guideTextFill)
      .style("font-size", guideFontSize + "px")
      .style("background-color", "#f9f9f9")
      .style("padding", "0 4px 0 4px");

    // Loop through data and plot the area chart
    dataFlat.columns.forEach((volume, i) => {
      if (volume === "Week") return;

      area.y1(d => {
        return yScale(d[volume]);
      });

      let downPage = spacing * (i - 1);
      let downPageText = spacing * (i - 1) + margin.top - 4;
      let downPageLine = spacing * (i - 1) + joyplotHeight;

      // Firefox and Opera render these lines 1px down so
      // if (firefox || opera) downPageLine--;
      // Actually it turns out to be a stranger issue

      svg
        .append("path")
        .attr("class", styles.singlePlot)
        .datum(dataFlat)
        .attr("fill", joyplotFill)
        .attr("transform", "translate(0, " + downPage + ")")
        .attr("d", area);

      // Draw a baseline
      svg
        .append("path")
        .attr("class", styles.singlePlot)
        .attr("d", baseline)
        .attr("stroke", joyplotFill)
        .attr("stroke-width", lineWidth + "px")
        .attr("fill", "none")
        // .attr("shape-rendering", shapeRendering)
        .attr("transform", "translate(0, " + downPageLine + ")");

      // Render the labels in a span to get text wrapping
      // We put it in a table-cell to achieve bottom aligning
      var labels = div
        .append("span")
        .classed(styles.labels, true)
        .style("width", labelMargin - 10 + "px")
        .style("top", downPageText + "px")
        .style("left", margin.left + "px")
        .style("position", "absolute");

      var labelsDiv = labels
        .append("div")
        .text(volume)
        .style("display", "table-cell")
        .style("vertical-align", "bottom")
        .style("font-size", fontSize + "px")
        .style("font-weight", "bold")
        .style("text-align", "left")
        .style("height", joyplotHeight + "px")
        .style("color", "#333");
    });

    // Remove and redraw chart
      resizeJoyplot = () => {
      
      width = parseInt(d3.select("." + styles.joyplot).style("width"), 10);
      width = width - margin.left - margin.right;

      // Update properties with new widths
      xScale = d3.scaleTime().range([labelMargin, width]);

      xScale.domain(
        d3.extent(dataFlat, function(d) {
          return d.Week;
        })
      );

      baselineData = [[0, 0], [labelMargin - 5, 0]];
      baseline = lineGenerator(baselineData);

      // Direct element manipulation first
      timeLine.attr("x2", width);
      timeLineRightBoundary.attr("x1", width).attr("x2", width);
      timeLineTextLeft.style("left", labelMargin + width * 0.05 + "px");
      timeLineTextRight.style("right", width * 0.05 + "px");

      d3.selectAll("." + styles.singlePlot).remove();

      dataFlat.columns.forEach((volume, i) => {
        if (volume === "Week") return;

        area.y1(d => {
          return yScale(d[volume]);
        });

        let downPage = spacing * (i - 1);
        let downPageLine = spacing * (i - 1) + joyplotHeight;
        let downPageText = spacing * (i - 1) + 95;

        // Firefox and Opera render these lines 1px down so
        // if (firefox || opera) downPageLine--;

        svg
          .append("path")
          .attr("class", styles.singlePlot)
          .datum(dataFlat)
          .attr("fill", "rgba(0, 125, 153, 0.6")
          .attr("transform", "translate(0, " + downPage + ")")
          .attr("d", area);

        svg
          .append("path")
          .attr("class", styles.singlePlot)
          .attr("d", baseline)
          .attr("stroke", joyplotFill)
          .attr("stroke-width", lineWidth + "px")
          .attr("fill", "none")
          .attr("shape-rendering", shapeRendering)
          .attr("transform", "translate(0, " + downPageLine + ")");
      });
    };

    window.addEventListener("resize", resizeJoyplot);
  }

  loadData() {
    d3
      .queue(2) // Load 2 files concurrently (if there are more than 1)
      .defer(d3.csv, this.props.dataUrl)
      .await(this.createChart);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", resizeJoyplot);
  }

  render(props, state) {
    return (
      <div className={styles.root}>
        <svg className={styles.joyplot} />
      </div>
    );
  }
}

module.exports = Joyplot;
