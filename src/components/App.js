import { h, Component } from "preact";

import Joyplot from "./Joyplot";
import Pulse from "./Pulse";
import Control from "./Control";
import Vegas from "./Vegas";

const dataURLs = {
  joyplot: `${__webpack_public_path__}data.csv`,
  pulse: `${__webpack_public_path__}pulse-data.csv`,
  control: `${__webpack_public_path__}gun-control-data.csv`,
  vegas: `${__webpack_public_path__}vegas-data.csv`,
  fullControl: `${__webpack_public_path__}gun-control-full-data.csv`
};

class App extends Component {
  render() {
    const { type } = this.props;

    switch (type) {
      case "joyplot":
        return <Joyplot dataUrl={dataURLs.joyplot} />;
        break;
      case "stacked":
        return <Pulse dataURL={dataURLs.pulse} dataURL2={dataURLs.control} />;
        break;
      case "control":
        return <Control dataURL={dataURLs.fullControl} dataURL2={dataURLs.control} />;
        break;
      case "vegas":
        return <Vegas dataURL={dataURLs.vegas} dataURL2={dataURLs.control} />;
    }
  }
}

export default App;
