const { h, Component } = require("preact");
import styles from "./ErrorBox.css";

class ErrorBox extends Component {
  componentDidMount() {
    console.error(this.props.error);
  }

  render() {
    return <pre className={styles.root}>{this.props.error.stack}</pre>;
  }
}

module.exports = ErrorBox;
