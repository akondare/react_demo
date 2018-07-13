import * as React from 'react';
import '../Styles/App.css';
import IDetected from './IDetected';
import categories from "./Objects";
import DrawToCanvasUtil from "./Utils/DrawToCanvasUtil";

interface IProps {
  rects:IDetected[][];
}

export default class PredictionView extends React.Component<IProps,{}> {
  protected colors = categories.map((e) => DrawToCanvasUtil.getRandomRGBColor());

  protected canvas:HTMLCanvasElement;

  public constructor(props) {
    super(props);
  }

  public componentWillReceiveProps(nextProps) {
    DrawToCanvasUtil.clearCanvas(this.canvas)
    let color:string;

    // make sure that all predictions are pre-translated based on their predictionRect
    nextProps.rects.forEach((cat:IDetected[],catInd:number) => {
      color = this.colors[catInd];
      cat.forEach((pred:IDetected) => {
        DrawToCanvasUtil.drawPredictionRect(this.canvas, pred, 2, color, 12);
      });
    });
  }

  public render() {
    return (
      <canvas ref={ref=>this.canvas=ref}/>
    );
  }
}