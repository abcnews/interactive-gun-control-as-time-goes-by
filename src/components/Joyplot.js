import { h, Component } from "preact";
import styles from "./Joyplot.scss";
import * as d3 from "d3";
import { format } from "date-fns";

// Making these event listener function file scope so they unmount
// when hot reloaded... until I find a better way
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
    let margin = { top: 60, right: 15, bottom: 60, left: 15 },
      width = parseInt(d3.select("." + styles.joyplot).style("width"), 10),
      joyplotHeight = 76,
      splitPoint = 0.16,
      labelMargin = width * splitPoint,
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
      guideFontSize = 11,
      resizeTimeout = 10;

    // We are using Mike Bostock's margin conventions https://bl.ocks.org/mbostock/3019563
    width = width - margin.left - margin.right;

    // Set up a date parser
    var parseDate = d3.timeParse("%d/%m/%y");

    // set the range scales
    var xScale = d3.scaleTime().range([0, width]);
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
    let interestLineData = [
      [0, 0],
      [interestLineWidth, 0]
    ];

    let lineGenerator = d3.line();

    let interestline = lineGenerator(interestLineData); // Point out 100% search interest

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
      d3.extent(dataFlat, function (d) {
        return d.Week;
      })
    );

    yScale.domain([
      -0.6, // Keep the baseline
      d3.max(dataFlat, function (d) {
        // Or just set to 100
        return d["Sydney siege"];
      })
    ]);

    // Draw some guides up top
    // 100% search interest
    const searchInterest = svg
      .append("g")
      .attr("transform", "translate(" + (width * 0.15 - interestLineWidth / 2 + 4) + ", 0)");

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
      .attr("font-size", guideFontSize);

    searchInterestText
      .append("tspan")
      .text("100% search")
      .attr("x", interestLineWidth + 5);

    searchInterestText
      .append("tspan")
      .text("interest")
      .attr("x", interestLineWidth + 5)
      .attr("y", 13);

    // Time periods
    let timeLineYPos = -25;

    let timeLine = svg
      .append("line")
      .attr("x1", 0)
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
      .attr("x1", 0)
      .attr("y1", timeLineYPos - 5.5)
      .attr("x2", 0)
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
      .style("top", timeLineYPos + margin.top - guideFontSize * 0.65 + "px")
      .style("left", width * 0.05 + margin.left + "px")
      .style("color", guideTextFill)
      .style("font-size", guideFontSize + "px")
      .style("background-color", "#f9f9f9")
      .style("padding", "0 4px 0 4px");

    let timeLineTextRight = div
      .append("span")
      .text(format(lastWeek, "MMM D, YYYY"))
      .style("position", "absolute")
      .style("top", timeLineYPos + margin.top - guideFontSize * 0.65 + "px")
      .style("right", width * 0.05 + margin.right + "px")
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
      let downPageText = spacing * (i - 1) + margin.top - 2;
      let downPageLine = spacing * (i - 1) + joyplotHeight;

      svg
        .append("path")
        .attr("class", styles.singlePlot)
        .datum(dataFlat)
        .attr("fill", joyplotFill)
        .attr("transform", "translate(0, " + downPage + ")")
        .attr("d", area);

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

      // Resize labels on mobile
      if (width < 500) {
        d3.selectAll("." + styles.labels + " div").style("font-size", fontSize - 1 + "px");
      } else {
        d3.selectAll("." + styles.labels + " div").style("font-size", fontSize + "px");
      }
    });

    // Remove and redraw chart. We are using a timer to resize after a while
    // to avoid trying to resize when window not ready
    var resizeTimer;

    resizeJoyplot = () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(function () {
        width = parseInt(d3.select("." + styles.joyplot).style("width"), 10);
        width = width - margin.left - margin.right;

        // Update properties with new widths
        xScale = d3.scaleTime().range([0, width]);

        xScale.domain(
          d3.extent(dataFlat, function (d) {
            return d.Week;
          })
        );

        // Direct element manipulation first
        timeLine.attr("x2", width);
        timeLineRightBoundary.attr("x1", width).attr("x2", width);
        timeLineTextLeft.style("left", width * 0.05 + margin.left + "px");
        timeLineTextRight.style("right", width * 0.05 + margin.right + "px");

        searchInterest.attr(
          "transform",
          "translate(" + (width * 0.15 - interestLineWidth / 2 + 4) + ", 0)"
        );

        // SelectAll manipulation
        labelMargin = width * splitPoint;
        d3.selectAll("." + styles.labels).style("width", labelMargin - 10 + "px");

        // Resize labels on mobile
        if (width < 500) {
          d3.selectAll("." + styles.labels + " div").style("font-size", fontSize - 1 + "px");
        } else {
          d3.selectAll("." + styles.labels + " div").style("font-size", fontSize + "px");
        }

        d3.selectAll("." + styles.singlePlot).remove();

        dataFlat.columns.forEach((volume, i) => {
          if (volume === "Week") return;

          area.y1(d => {
            return yScale(d[volume]);
          });

          let downPage = spacing * (i - 1);
          let downPageLine = spacing * (i - 1) + joyplotHeight;
          let downPageText = spacing * (i - 1) + 95;

          svg
            .append("path")
            .attr("class", styles.singlePlot)
            .datum(dataFlat)
            .attr("fill", "rgba(0, 125, 153, 0.6")
            .attr("transform", "translate(0, " + downPage + ")")
            .attr("d", area);
        });
      }, resizeTimeout);
    };

    window.addEventListener("resize", resizeJoyplot);
    setTimeout(resizeJoyplot, resizeTimeout);
  }

  loadData() {
    d3.queue(2) // Load 2 files concurrently (if there are more than 1)
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

export default Joyplot;
