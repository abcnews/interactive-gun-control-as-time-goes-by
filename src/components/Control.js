import { h, Component } from "preact";
import styles from "./Control.scss";
import * as d3 from "d3";

var resizeControl;

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

  createChart(error, dataFlat) {
    // Inital variables
    let margin = { top: 60, right: 15, bottom: 60, left: 15 },
      width = parseInt(d3.select("." + styles.control).style("width"), 10),
      joyplotHeight = 256,
      labelMargin = width * (1 / 2),
      spacing = 200,
      totalPlots = dataFlat.columns.length - 1,
      height = joyplotHeight, // (totalPlots - 3) * spacing + joyplotHeight,
      guideFill = "rgba(92, 108, 112, 0.5)",
      guideTextFill = "rgba(92, 108, 122, 1.0)",
      lineWidth = 1,
      shapeRendering = "crispEdges",
      interestLineWidth = 50,
      fontSize = 15,
      guideFontSize = 11,
      maxSearchIndex = 100,
      splitPoint = 0.288,
      resizeTimeout = 10;

    // We are using Mike Bostock's margin conventions https://bl.ocks.org/mbostock/3019563
    width = width - margin.left - margin.right;

    const shootingColor = "rgba(0, 125, 153, 0.5)";

    // Set up a date parser
    var parseDate = d3.timeParse("%Y-%m");

    // set the range scales
    var xScale = d3.scaleTime().range([0, width]);
    var yScale = d3.scaleLinear().range([joyplotHeight, 0]);

    // define the chart area
    let area = d3
      .area()
      .x(d => {
        return xScale(d.Month);
      })
      .y1(d => {
        return yScale(maxSearchIndex);
      })
      .y0(yScale(0))
      .curve(d3.curveMonotoneX);

    let interestLineData = [
      [0, 0],
      [interestLineWidth, 0]
    ];
    let lineGenerator = d3.line();
    let interestline = lineGenerator(interestLineData);

    // Parse the dates to use full date format
    dataFlat.forEach(d => {
      d.Month = parseDate(d["Month"]);
    });

    // Convert the number strings to integers
    dataFlat.columns.forEach(d => {
      dataFlat.forEach(e => {
        if (d !== "Gun control searches") return;
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
      d3.extent(dataFlat, function (d) {
        return d.Month;
      })
    );

    yScale.domain([
      -0.4, // Maintain a base line
      d3.max(dataFlat, function (d) {
        return maxSearchIndex;
      })
    ]);

    // Time periods
    let timeLineYPos = -35;

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

    // Annotations of different peaks we are doing this bespoke for now unfortunately
    let annotationColor = "#007D99";

    dataFlat.forEach(annotate);

    function annotate(object, i) {
      if (object.Event === "" || object.Hidden === "TRUE") return;

      let annotationLineSize = 5;

      // Draw left aligned annotation
      let annotation = svg
        .append("g")
        .classed(styles.annotation, true)
        .attr(
          "transform",
          "translate(" +
            xScale(object.Month) +
            ", " +
            (yScale(object["Gun control searches"]) - 3) +
            ")"
        );

      let annotationText = annotation
        .append("text")
        .attr("font-size", guideFontSize)
        .attr("font-weight", "bold")
        .text(object.Event)
        .attr("fill", annotationColor)
        .attr("x", annotationLineSize + 1)
        .attr("y", -annotationLineSize - 1);
      // .attr("transform", "rotate(-45)");

      let annotationLine = annotation
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", annotationLineSize)
        .attr("y2", -annotationLineSize)
        .attr("stroke", annotationColor);

      // Right align some labels
      if (object.Alignment === "right") {
        annotationText
          .attr("text-anchor", "end")
          .attr("x", -annotationLineSize - 1)
          .attr("y", -annotationLineSize - 1);

        annotationLine.attr("x2", -annotationLineSize).attr("y2", -annotationLineSize);
      }

      if (object.Alignment === "center") {
        annotationText
          .attr("text-anchor", "middle")
          .attr("x", 0)
          .attr("y", -annotationLineSize * 1.9 - 3);

        annotationLine.attr("x2", 0).attr("y2", -annotationLineSize * 1.9);
      }

      if (object.Mobile === "hidden" && width < 500) {
        annotation.style("display", "none");
      }
    }

    // Timeline text
    let timeLineTextLeft = div
      .append("span")
      .text("2007")
      .style("position", "absolute")
      .style("top", timeLineYPos + margin.top - guideFontSize * 0.65 + "px")
      .style("left", width * 0.1 + margin.left + "px")
      .style("color", guideTextFill)
      .style("font-size", guideFontSize + "px")
      .style("background-color", "#f9f9f9")
      .style("padding", "0 4px 0 4px");

    let timeLineTextRight = div
      .append("span")
      .text("2017")
      .style("position", "absolute")
      .style("top", timeLineYPos + margin.top - guideFontSize * 0.65 + "px")
      .style("right", width * 0.1 + margin.right + "px")
      .style("color", guideTextFill)
      .style("font-size", guideFontSize + "px")
      .style("background-color", "#f9f9f9")
      .style("padding", "0 4px 0 4px");

    dataFlat.columns.forEach((volume, i) => {
      if (volume !== "Gun control searches") return;

      area.y1(d => {
        return yScale(d[volume]);
      });

      let downPage = (i - 1) * spacing;
      let downPageText = spacing * (i - 1) + margin.top - 2;

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
        .style("top", downPageText - 20 + "px")
        .style("left", margin.left + "px")
        .style("position", "absolute");

      var labelsDiv = labels
        .append("div")
        .text(volume)
        .style("display", "table-cell")
        .style("vertical-align", "middle")
        .style("font-size", fontSize + "px")
        .style("font-weight", "bold")
        .style("text-align", "left")
        .style("height", joyplotHeight + "px")
        .style("color", "#333");
    });

    // Remove and redraw chart
    // Use addEventListener to avoid overriding the listener
    var resizeTimer;

    resizeControl = () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(function () {
        width = parseInt(d3.select("." + styles.control).style("width"), 10);
        width = width - margin.left - margin.right;

        xScale = d3.scaleTime().range([0, width]);

        xScale.domain(
          d3.extent(dataFlat, function (d) {
            return d.Month;
          })
        );

        // Direct resizing
        timeLine.attr("x2", width);
        timeLineRightBoundary.attr("x1", width).attr("x2", width);
        timeLineTextLeft.style("left", width * 0.1 + margin.left + "px");
        timeLineTextRight.style("right", width * 0.1 + margin.right + "px");

        // Selection based resizing

        // Resize the labels
        (labelMargin = width * (1 / 2)),
          d3.selectAll("." + styles.labels).style("width", labelMargin - 10 + "px");

        // Remove all loop-through items so we can replace later
        d3.selectAll("." + styles.singlePlot).remove();
        d3.selectAll("." + styles.annotation).remove();

        dataFlat.columns.forEach((volume, i) => {
          if (volume !== "Gun control searches") return;

          area.y1(d => {
            return yScale(d[volume]);
          });

          let downPage = spacing * (i - 1);
          // let downPageLine = spacing * (i - 1) + joyplotHeight;
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
        });

        // Re-annotate on resize
        dataFlat.forEach(annotate);
      }, resizeTimeout);
    };
    window.addEventListener("resize", resizeControl);
    setTimeout(resizeControl, resizeTimeout);
  } // end createChart

  componentWillUnmount() {
    window.removeEventListener("resize", resizeControl);
  }

  loadData() {
    d3.queue(2) // Load files concurrently (if more than 1)
      .defer(d3.csv, this.props.dataURL)
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

export default Control;
