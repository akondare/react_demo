import * as tf from '@tensorflow/tfjs'
import * as React from 'react';
import './App.css';
import Settings from './Settings';

interface IImageSpace {
  img:HTMLImageElement,
  // imgSrc:string;
  isLoaded:boolean;
  isLoading:boolean;
  isDetected:boolean;
  isDetecting:boolean;
  isTraining:boolean;
  onImgRender:()=>any;
  onPredRender:()=>any;
}

class ImageSpace extends React.Component<IImageSpace,{}> {
  
  // update on choosing image
  protected predCanvas:HTMLCanvasElement;
  protected imageCanvas:HTMLCanvasElement;
  protected canvasWrapper:HTMLDivElement;

  // grab model config
  protected model:tf.Model;
  protected iouThreshold:number = Settings.ModelIouThreshold;
  protected classProbThreshold:number = Settings.ModelClassProbThreshold;
  protected maxPix:number = Settings.ModelInputPixelSize;

  // update on prediction
  protected predictions:number[];
  protected predictionsRect:any; // add rect type

  public constructor(props:any) {
    super(props)
  }

  public async processImage() {
    /* TODO */
    const aspect = this.props.img.naturalWidth / this.props.img.naturalHeight;

    if( this.img.naturalWidth >= this.imageCanvas.naturalHeight) {
      this.imageCanvas.height = this.maxPix;
      this.imageCanvas.width = this.maxPix*aspectRatio;
    }
    else {
      this.imageCanvas.width = this.maxPix;
      this.imageCanvas.height = this.maxPix*aspectRatio;
    }

    this.imageCanvas.width = this.predCanvas.width;
  }
  public async predict() {
    /* TODO */
  }
  
  public render() {
    if( this.props.isLoading ) {
      this.processImage();
      this.props.onImgRender();
    }
    if( this.props.isDetecting ) {
      this.predict();
      this.props.onPredRender();
    }
    return (
      <div className="ImageSpace" ref = {ref => this.canvasWrapper = ref}>
        { this.props.isLoaded && <canvas className={"PredCanvas"} ref = {ref => this.imageCanvas = ref}/> }
        { this.props.isDetected && <canvas className={"ImageCanvas"} ref = {ref => this.predCanvas = ref}/> }
      </div>
    );
  }
}

export default ImageSpace;