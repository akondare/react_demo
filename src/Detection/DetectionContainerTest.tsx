import * as tf from '@tensorflow/tfjs';
import * as React from 'react';
import * as smartcrop from 'smartcrop';
import '../Styles/App.css';
import Config from './Config';
import Control from './Control';
import IDetected from './IDetected'
import ImageView from "./ImageView"
import categories from './Objects';
import PredictionView from "./PredictionView"
import RetrainView from "./RetrainView"
import Rect from './Shapes/Rect';
import DrawToCanvasUtil from './Utils/DrawToCanvasUtil'
import ImgProcessingUtil from './Utils/ImgProcessingUtil'

/*
interface IProps {
  style:React.CSSProperties
}
*/
interface IState {
  isModelLoaded:boolean;
  isFileLoaded:boolean;
  areObjsDetected:boolean;
  isTraining:boolean;

  height:number;
  width:number;
  objInds:number[];
}

class DetectionContainer extends React.Component<{}, IState > {

  protected img:HTMLImageElement = new Image();
  protected readonly changeOptions = {
    onDet : (   () => {
                    if( this.state.isFileLoaded ) {
                        this.setState({areObjsDetected:true})
                    }
                }
            ).bind(this),
    onFle : (   (event:any) => {
                    this.setState({isFileLoaded:true});
                    this.img.src = URL.createObjectURL(event.target.files[0]);
                }
            ).bind(this),
    onTrn : (   () => {
                    /* TODO */
                }
            ).bind(this),
    toggleCat : ((i:number) => {this.state.objInds[i] = this.state.objInds[i] ? 0 : 1}).bind(this),
  }

  // update on choosing image
  protected predCanvas:HTMLCanvasElement;
  protected imageCanvas:HTMLCanvasElement;

  // grab model config
  protected model:tf.Model;
  protected iouThreshold:number = Config.ModelIouThreshold;
  protected classProbThreshold:number = Config.ModelClassProbThreshold;
  protected maxPix:number = Config.ModelInputPixelSize;

  // update on prediction
  protected predictions:IDetected[][];
  protected predictionsRect:Rect; // add rect type

  public constructor(props: any) {
      super(props);
      this.state = { isModelLoaded: false, isFileLoaded:false, areObjsDetected: false, isTraining: false, height: 0, objInds:categories.map((c)=>1), width:0 };
      this.loadImgToCanvas = this.loadImgToCanvas.bind(this);
      this.detect = this.detect.bind(this);
      this.predict = this.predict.bind(this);
      this.loadModel = this.loadModel.bind(this);
  }
  public async componentDidMount() {
      this.loadModel();
      this.img.addEventListener('load', this.loadImgToCanvas)
  }
  public render() {
    const ControlProps = {
        canChangeCats:true,
        canDetect:true,
        canOpenFile:true,
        canTrain:true,
        ...this.changeOptions,
        catInds:this.state.objInds,
        cats:categories,
    };
    return (
      this.state.isModelLoaded && 
      <div className='DetectionContainer'>
        <header className="Header">
          <h1 className="Title">Object Detector</h1>
          <Control {...ControlProps}/>
        </header>
        <div className="ImgView" style={{height:this.state.height+'px',width:this.state.width+'px'}}>
            <ImageView />
            <PredictionView rects={this.predictions}/>
            <RetrainView />
        </div>
      </div>
    );
  }
  /* <ImageView  {...this.state} style={imgViewStyle} imgCan={this.imageCanvas} predCan={this.predCanvas} /> */

  protected async loadModel() {
      this.model = await tf.loadModel(Config.ModelPath);
      this.setState({isModelLoaded:true});
  }

  protected loadImgToCanvas() {
      const aspectRatio:number = this.img.naturalWidth / this.img.naturalHeight;

      if (this.img.naturalWidth >= this.img.naturalHeight) {
        this.imageCanvas.height = this.maxPix;
        this.imageCanvas.width = this.maxPix * aspectRatio;
      } 
      else {
        this.imageCanvas.width = this.maxPix;
        this.imageCanvas.height = this.maxPix / aspectRatio;
      }

        this.predCanvas.width = this.imageCanvas.width;
        this.predCanvas.height = this.imageCanvas.height;

        this.setState({width:this.predCanvas.width,height:this.predCanvas.height})

        const ctx:CanvasRenderingContext2D = this.imageCanvas.getContext('2d');
        ctx.drawImage(this.img, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
        this.detect();
        console.log(this.imageCanvas);
        console.log(this.predCanvas);
        console.log(this.state)
  };

  protected loadPredToCanvas() {
    let color:string;
    this.state.objInds.forEach((e,i) => {
        if(e) {
            color = DrawToCanvasUtil.getRandomRGBColor();
            this.predictions[i].forEach((prediction:IDetected) => {
                prediction.rect.translateByVector({x: this.predictionsRect.x, y: this.predictionsRect.y});
                DrawToCanvasUtil.drawPredictionRect(this.predCanvas, prediction, 2, color, 12);
            });
        }
    });
  }

  protected async detect() {
    if( !this.state.areObjsDetected ) {
      await this.drawPredRects();
      this.predictions = await this.predict();
      this.setState({areObjsDetected:true})
    }

    console.log(this.predictions)
    if(this.predictions !== null) {
        this.loadPredToCanvas();
    }
  }

  protected async seperate() {
        const size = Math.min(this.imageCanvas.width, this.imageCanvas.height);
        const imgSize = Math.min(this.img.naturalWidth, this.img.naturalHeight);
        const scale = imgSize/size;

        

        const smartCropRect = await smartcrop.crop(this.img, { width: imgSize, height: imgSize });
        
        this.predictionsRect = new Rect(
            smartCropRect.topCrop.x / scale,
            smartCropRect.topCrop.y / scale,
            smartCropRect.topCrop.width / scale,
            smartCropRect.topCrop.height / scale
        );

        DrawToCanvasUtil.shadeEverythingButRect(this.predCanvas, this.predictionsRect, "rgba(0, 0, 0, 0.7)");
        DrawToCanvasUtil.drawRect(this.predCanvas, this.predictionsRect, "rgba(255, 255, 255, 0.5)", 1);
  }
  protected async drawPredRects() {
        const size = Math.min(this.imageCanvas.width, this.imageCanvas.height);
        const imgSize = Math.min(this.img.naturalWidth, this.img.naturalHeight);
        const scale = imgSize/size;

        const smartCropRect = await smartcrop.crop(this.img, { width: imgSize, height: imgSize });
        
        this.predictionsRect = new Rect(
            smartCropRect.topCrop.x / scale,
            smartCropRect.topCrop.y / scale,
            smartCropRect.topCrop.width / scale,
            smartCropRect.topCrop.height / scale
        );

        DrawToCanvasUtil.shadeEverythingButRect(this.predCanvas, this.predictionsRect, "rgba(0, 0, 0, 0.7)");
        DrawToCanvasUtil.drawRect(this.predCanvas, this.predictionsRect, "rgba(255, 255, 255, 0.5)", 1);
  }
  protected async predict():Promise<IDetected[][]> {

    // Load model settings from app settings
    const anchors = Config.ModelAnchors;
    const numClasses = Config.ModelClassCount;

    const imageData = this.imageCanvas.getContext("2d").getImageData(0, 0, this.imageCanvas.width, this.imageCanvas.height);

    const [allBoxes, boxConfidence, boxClassProbs] = await tf.tidy(() => {

        const pixels:tf.Tensor3D = tf.fromPixels(imageData, 3);
        const pixelsCropped:tf.Tensor3D = pixels.slice([this.predictionsRect.y, this.predictionsRect.x, 0], [this.maxPix, this.maxPix, 3]);
        let batchedImage:tf.Tensor4D = pixelsCropped.expandDims(0);
        batchedImage = batchedImage.toFloat().div(tf.scalar(255))

        const modelOutput:tf.Tensor4D = this.model.predict(batchedImage) as tf.Tensor4D;

        // console.log(tf.ENV);
        
        const [boxXY, boxWH, boxC, boxClassP] = ImgProcessingUtil.yoloHead(modelOutput, anchors, numClasses);
        const allB = ImgProcessingUtil.boxesToCorners(boxXY, boxWH);

        return [allB, boxC, boxClassP];
    });

    const [origBoxes, scores, classes] = await ImgProcessingUtil.filterBoxes(
                                            allBoxes, boxConfidence, boxClassProbs, 0.01);
    let boxes = origBoxes;
    
    // 2d predictions array  
    const ret:IDetected[][] = new Array(categories.length)
    for( let i = 0; i<ret.length; i++) { ret[i] = []; }

    // If all boxes have been filtered out
    if (boxes == null) {
        return ret;
    }

    const width = tf.scalar(this.maxPix);
    const height = tf.scalar(this.maxPix);

    const imageDims = tf.stack([height, width, height, width]).reshape([1,4]);

    boxes = tf.mul(boxes, imageDims);

    const [ preKeepBoxesArr, scoresArr ] = await Promise.all([
        boxes.data(), scores.data(),
    ]);

    const [ keepIndx, boxesArr, keepScores ] = ImgProcessingUtil.nonMaxSuppression(
        preKeepBoxesArr,
        scoresArr,
        this.iouThreshold,
    );

    const classesIndexArr = await classes.gather(tf.tensor1d(keepIndx, 'int32')).data();

    classesIndexArr.forEach((results:IDetected[], classIndexValue:number, index:number) => {
        const classProbability = keepScores[index];
        if (classProbability < this.classProbThreshold) {
            return;
        }

        const className = categories[classIndexValue];
        const [top, left, bottom, right] = boxesArr[index];

        const x = Math.max(0, left);
        const y = Math.max(0, top);
        const w = Math.min(this.maxPix, right) - x;
        const h = Math.min(this.maxPix, bottom) - y;
        
        const nextObject:IDetected = {
            class: className,
            probability: classProbability,
            rect: new Rect(x, y, w, h)
        };

        ret[classIndexValue].push(nextObject);
    });

    return ret;
    /*
    return classesIndexArr.reduce((results:IDetected[], classIndexValue:number, index:number) => {
        const classProbability = keepScores[index];
        if (classProbability < this.classProbThreshold) {
            return results;
        }

        const className = categories[classIndexValue];
        const [top, left, bottom, right] = boxesArr[index];

        const x = Math.max(0, left);
        const y = Math.max(0, top);
        const w = Math.min(this.maxPix, right) - x;
        const h = Math.min(this.maxPix, bottom) - y;
        
        const nextObject:IDetected = {
            class: className,
            probability: classProbability,
            rect: new Rect(x, y, w, h)
        };

        return results.concat([nextObject]);
    }, []);
    */
}

}

export default DetectionContainer;
