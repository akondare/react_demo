import * as React from 'react';
import '../Styles/App.css';
// import IDetected from './IDetected';
import categories from "./Objects";
import DrawToCanvasUtil from "./Utils/DrawToCanvasUtil";

export default class RetrainView extends React.Component<{},{}> {
  protected colors = categories.map((e) => DrawToCanvasUtil.getRandomRGBColor());

  protected canvas:HTMLCanvasElement;

  public constructor(props) {
    super(props);
  }

  public render() {
    return (
      <canvas ref={ref=>this.canvas=ref}/>
    );
  }
}