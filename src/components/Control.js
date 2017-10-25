import { h, Component } from "preact";
import * as styles from "./Control.scss";
import * as d3 from "d3";

class Control extends Component {
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

  createChart(error, dataFlat, gunControlData) {
    // Inital variables
    let margin = { top: 60, right: 5, bottom: 70, left: 5 },
      width = parseInt(d3.select("." + styles.control).style("width"), 10),
      joyplotHeight = 75,
      labelMargin = 110,
      spacing = 54,
      totalPlots = dataFlat.columns.length - 1,
      height = (totalPlots - 1) * spacing + joyplotHeight,
      guideFill = "rgba(92, 108, 112, 0.5)",
      guideTextFill = "rgba(92, 108, 122, 1.0)",
      lineWidth = 1,
      shapeRendering = "crispEdges",
      interestLineWidth = 50,
      fontSize = 15,
      guideFontSize = 11,
      maxSearchIndex = 100,
      splitPoint = 0.288;

    // We are using Mike Bostock's margin conventions https://bl.ocks.org/mbostock/3019563
    width = width - margin.left - margin.right;

    const shootingColor = "rgba(0, 125, 153, 0.5)";
    const gunControlColor = "rgba(255, 97, 0, 0.75)";

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
      .y1(d => {
        return yScale(maxSearchIndex);
      })
      .y0(yScale(0))
      .curve(d3.curveMonotoneX);

    let interestLineData = [[0, 0], [interestLineWidth, 0]];
    let lineGenerator = d3.line();
    let interestline = lineGenerator(interestLineData);

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

    gunControlData.forEach(d => {
      d.Week = parseDate(d["Week"]);
    });

    // Convert the number strings to integers
    gunControlData.columns.forEach(d => {
      dataFlat.forEach(e => {
        if (d === "Week") return;
        e[d] = +e[d];
      });
    });

    // Get the containing div for labels
    const div = d3.select("." + styles.root);

    // Draw the chart
    var svg = d3
      .select("." + styles.control)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    xScale.domain(
      d3.extent(dataFlat, function(d) {
        return d.Week;
      })
    );

    yScale.domain([
      -0.4, // Maintain a base line
      d3.max(dataFlat, function(d) {
        return maxSearchIndex;
      })
    ]);

    // Draw some guides up top
    const searchInterest = svg
      .append("g")
      .attr(
        "transform",
        "translate(" + (width * 0.33 - interestLineWidth / 2 + 4) + ", 0)"
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
      .attr("font-size", 11)
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

    // Middle boundary line - reposition below
    let timeEventMarker = svg
      .append("line")
      .attr("x1", width * splitPoint)
      .attr("y1", timeLineYPos - 5.5)
      .attr("x2", width * splitPoint)
      .attr("y2", timeLineYPos + 5.5)
      .attr("stroke", guideFill)
      .attr("stroke-width", lineWidth + "px")
      .attr("fill", "none")
      .attr("shape-rendering", shapeRendering);

    // Coloured pointers to area charts
    let shootingGroupColor = "#007D99";

    let shootingGroup = svg
      .append("g")
      .attr(
        "transform",
        "translate(" + width * 0.48 + ", " + joyplotHeight * 0.55 + ")"
      );

    shootingGroup
      .append("text")
      .attr("font-size", guideFontSize)
      .attr("font-weight", "bold")
      .text("SHOOTING")
      .attr("fill", shootingGroupColor);

    shootingGroup
      .append("line")
      .attr("x1", -2)
      .attr("y1", 2)
      .attr("x2", -10)
      .attr("y2", 10)
      .attr("stroke", shootingGroupColor);

    // Gun control label text group
    let gunControlGroupColor = "#C44B00";

    let gunControlGroup = svg
      .append("g")
      .attr(
        "transform",
        "translate(" + width * 0.85 + ", " + joyplotHeight * 0.55 + ")"
      );

    var gunControlText = gunControlGroup
      .append("text")
      .attr("font-size", guideFontSize)
      .attr("font-weight", "bold")
      .attr("fill", gunControlGroupColor);

    gunControlText
      .append("tspan")
      .text("GUN")
      .attr("text-anchor", "middle");
    gunControlText
      .append("tspan")
      .text("CONTROL")
      .attr("x", 0)
      .attr("y", guideFontSize)
      .attr("text-anchor", "middle");

    gunControlGroup
      .append("line")
      .attr("x1", 0)
      .attr("y1", guideFontSize + 5)
      .attr("x2", 0)
      .attr("y2", guideFontSize + 15)
      .attr("stroke", gunControlGroupColor);

    // Timeline text
    let timeLineTextLeft = div
      .append("span")
      .text("1 week")
      .style("position", "absolute")
      .style("top", timeLineYPos + margin.top - guideFontSize * 0.6 + "px")
      .style("left", width * 0.185 - 20 + "px")
      .style("color", guideTextFill)
      .style("font-size", guideFontSize + "px")
      .style("background-color", "#f9f9f9");

    let timeLineTextRight = div
      .append("span")
      .text("2 weeks")
      .style("position", "absolute")
      .style("top", timeLineYPos + margin.top - guideFontSize * 0.6 + "px")
      .style("right", width * 0.37 - 20 + "px")
      .style("color", guideTextFill)
      .style("font-size", guideFontSize + "px")
      .style("background-color", "#f9f9f9");

    dataFlat.columns.forEach((volume, i) => {
      if (volume === "Week") return;

      area.y1(d => {
        return yScale(d[volume]);
      });

      let downPage = (i - 1) * spacing;
      let downPageText = spacing * (i - 1) + margin.top - 4;

      svg
        .append("path")
        .classed(styles.singlePlot, true)
        .datum(dataFlat)
        .attr("fill", shootingColor)
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

      // Try to render gun control in same forEach loop
      // rather than it's own loop to avoid overpaint
      let gunControlVolumeLabel = gunControlData.columns[i];

      area.y1(d => {
        return yScale(d[gunControlVolumeLabel]);
      });

      svg
        .append("path")
        .classed(styles.singlePlot, true)
        .datum(gunControlData)
        .attr("fill", gunControlColor)
        .attr("transform", "translate(0, " + downPage + ")")
        .attr("d", area);
    });

    // Remove and redraw chart
    // Use addEventListener to avoid overriding the listener
    window.addEventListener("resize", resizeControl);

    function resizeControl() {
      width = parseInt(d3.select("." + styles.control).style("width"), 10);
      width = width - margin.left - margin.right;

      xScale = d3.scaleTime().range([0, width]);

      xScale.domain(
        d3.extent(dataFlat, function(d) {
          return d.Week;
        })
      );

      // baselineData = [[0, 0], [labelMargin - 5, 0]];
      // baseline = lineGenerator(baselineData);

      // Direct resizing
      timeLine.attr("x2", width);
      timeLineRightBoundary.attr("x1", width).attr("x2", width);
      timeLineTextLeft.style("left", width * 0.185 - 20 + "px");
      timeLineTextRight.style("right", width * 0.37 - 20 + "px");
      timeEventMarker
        .attr("x1", width * splitPoint)
        .attr("x2", width * splitPoint);
      shootingGroup.attr(
        "transform",
        "translate(" + width * 0.48 + ", " + joyplotHeight * 0.55 + ")"
      );
      gunControlGroup.attr(
        "transform",
        "translate(" + width * 0.85 + ", " + joyplotHeight * 0.55 + ")"
      );

      d3.selectAll("." + styles.singlePlot).remove();

      searchInterest.attr(
        "transform",
        "translate(" + (width * 0.33 - interestLineWidth / 2 + 4) + ", 0)"
      );

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
          .classed(styles.singlePlot, true)
          .datum(dataFlat)
          .attr("fill", shootingColor)
          .attr("transform", "translate(0, " + downPage + ")")
          .attr("d", area);

        // Try to render gun control in same forEach loop
        // rather than it's own loop to avoid overpaint
        let gunControlVolumeLabel = gunControlData.columns[i];

        area.y1(d => {
          return yScale(d[gunControlVolumeLabel]);
        });

        svg
          .append("path")
          .classed(styles.singlePlot, true)
          .datum(gunControlData)
          .attr("fill", gunControlColor)
          .attr("transform", "translate(0, " + downPage + ")")
          .attr("d", area);
      });
    }
  } // end createChart

  loadData() {
    d3
      .queue(2) // Load files concurrently (if more than 1)
      .defer(d3.csv, this.props.dataURL)
      .defer(d3.csv, this.props.dataURL2)
      .await(this.createChart);
  }

  render(props, state) {
    return (
      <div className={styles.root}>
        <svg className={styles.control} />
      </div>
    );
  }
}

module.exports = Control;
