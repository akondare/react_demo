import * as tf from '@tensorflow/tfjs'
import * as React from 'react';
import Config from './Config';
import Control from './Control';
import IDetected from './IDetected'
import ImageView from './ImageView';
import categories from './Objects';
import Rect from './Shapes/Rect';
import DrawToCanvasUtil from './Utils/DrawToCanvasUtil'
import ImgProcessingUtil from './Utils/ImgProcessingUtil'

interface IProps {
    style:React.CSSProperties
}
interface IState {
  isModelLoaded:boolean;
  isFileLoaded:boolean;
  areObjsDetected:boolean;
  isTraining:boolean;

  height:number;
  width:number;
}

class DetectionContainer extends React.Component<IProps, IState > {

  protected img:HTMLImageElement = new Image();
  protected readonly changeOptions = {
    onDet : (   (event:any) => {
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
    onObj : (   (event:any) => {
                    if( this.state.isFileLoaded ) {
                        /* TODO Change ObjCats */
                    }
                }
            ).bind(this),
    onTrn : (   (event:any) => {
                    /* TODO */
                }
            ).bind(this),
  }

  // update on choosing image
  protected predCanvas:HTMLCanvasElement;
  protected imageCanvas:HTMLCanvasElement;
  protected canvasWrapper:HTMLDivElement;

  // grab model config
  protected model:tf.Model;
  protected iouThreshold:number = Config.ModelIouThreshold;
  protected classProbThreshold:number = Config.ModelClassProbThreshold;
  protected maxPix:number = Config.ModelInputPixelSize;
  protected objCats:string[] = categories;

  // update on prediction
  protected predictions:number[];
  protected predictionsRect:any; // add rect type

  public constructor(props: any) {
      super(props);
      this.state = { isModelLoaded: false, isFileLoaded:false, areObjsDetected: false, isTraining: false, height: 0, width:0 };
  }
  public async componentDidMount() {
      this.loadModel();
      this.img.addEventListener('load', this.loadImgToCanvas)
  }
  public render() {
    const imgViewStyle = { 
        height:this.state.height+"px",
        width:this.state.width+"px",
    };
    return (
      this.state.isModelLoaded && 
      <div className='App'>
        <header className="App-header">
          <h1 className="App-title">Object Detector</h1>
          <Control {...this.changeOptions} {...this.state} cats={this.objCats}/>
        </header>
        <ImageView  {...this.state} style={imgViewStyle} imgCan={this.imageCanvas} predCan={this.predCanvas} />
      </div>
    );
  }

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

        this.predCanvas.width = this.predCanvas.width;
        this.predCanvas.height = this.predCanvas.height;

        this.setState({width:this.predCanvas.width,height:this.predCanvas.height})

        const ctx:CanvasRenderingContext2D = this.imageCanvas.getContext('2d');
        ctx.drawImage(this.img, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
  };

  protected async detect() {
      await this.drawPredRects();
      const predictions = await this.predict();

      if(predictions === null) {
        return;
      }

      const class2ColorLedger:any = {};
      predictions.forEach((prediction:IDetected) => {
        prediction.rect.translateByVector({x: this.predictionsRect.x, y: this.predictionsRect.y});
                    
        let color:string; 
        if (prediction.class in class2ColorLedger) {
            color = class2ColorLedger[prediction.class];
        } else {
            color = DrawToCanvasUtil.getRandomRGBColor();
            class2ColorLedger[prediction.class] = color;
        }
                    
        DrawToCanvasUtil.drawPredictionRect(this.predCanvas, prediction, 2, color, 12);
      });
  }

  protected async drawPredRects() {
    /*
        const size = Math.min(this.imageCanvas.width, this.imageCanvas.height);
        const imgSize = Math.min(this.img.naturalWidth, this.img.naturalHeight);
        const scale = imgSize/size;

        let smartCropRect = await smartcrop.crop(this.img, { width: imgSize, height: imgSize });
        
        this.predictionsRect = new Rect(
            smartCropRect.topCrop.x / scale,
            smartCropRect.topCrop.y / scale,
            smartCropRect.topCrop.width / scale,
            smartCropRect.topCrop.height / scale
        );

        DrawUtil.shadeEverythingButRect(this.activeCanvas, this.predictionsRect, "rgba(0, 0, 0, 0.7)");
        DrawUtil.drawRect(this.activeCanvas, this.predictionsRect, "rgba(255, 255, 255, 0.5)", 1);
    */
  }
  protected async predict():Promise<IDetected[]> {

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
    
    // If all boxes have been filtered out
    if (boxes == null) {
        return [];
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
}

}

export default DetectionContainer;
