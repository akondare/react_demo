import * as tf from '@tensorflow/tfjs';
import * as React from 'react';
import * as smartcrop from 'smartcrop';
import '../Styles/App.css';
import Config from './Config';
import Control from './Control';
import IDetected from './IDetected'
// import ImageView from './ImageView';
import categories from './Objects';
// import PredictionView from "./PredictionView";
import Rect from './Shapes/Rect';
import DrawToCanvasUtil from './Utils/DrawToCanvasUtil';
import ImgProcessingUtil from './Utils/ImgProcessingUtil';

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
  isProcessing:boolean;

  height:number;
  width:number;
}

class DetectionContainer extends React.Component<{}, IState > {

  protected img:HTMLImageElement = new Image();
  protected readonly changeOptions = {
    onDet : (   () => {
                    this.detect();
                }
            ).bind(this),
    onFle : (   (event:any) => {
                    this.setState({isFileLoaded:true,areObjsDetected:false});
                    this.img.src = URL.createObjectURL(event.target.files[0]);
                }
            ).bind(this),
    onTrn : (   () => {
                    /* TODO */
                }
            ).bind(this),
    toggleCat : ((i:number) => {
                    this.objInds[i] = this.objInds[i] ? 0 : 1;
                    this.loadPredToCanvas();
            }).bind(this),
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
  protected drawn:IDetected[][];
  protected colors:string[];
  protected predictionsRect:Rect; // add rect type
  protected predRects:Rect[]; // add rect type

  protected objInds:number[];

  public constructor(props: any) {
      super(props);
      this.state = { isProcessing:false, isModelLoaded: false, isFileLoaded:false, areObjsDetected: false, isTraining: false, height: 0, width:0 };
      this.objInds = categories.map((c)=>1)
      this.loadImgToCanvas = this.loadImgToCanvas.bind(this);
      this.detect1 = this.detect1.bind(this);
      this.detect2 = this.detect2.bind(this);
      this.predict = this.predict.bind(this);
      this.loadModel = this.loadModel.bind(this);
      this.colors = categories.map((e) => DrawToCanvasUtil.getRandomRGBColor());
  }
  public async componentDidMount() {
      this.loadModel();
      this.img.addEventListener('load', this.loadImgToCanvas)
  }
  public render() {
    const ControlProps = {
        canChangeCats:!this.state.isProcessing,
        canDetect:(!this.state.isProcessing) && this.state.isFileLoaded && (!this.state.areObjsDetected),
        canOpenFile:(!this.state.isProcessing) && this.state.isModelLoaded,
        canTrain:(!this.state.isProcessing) && false,
        ...this.changeOptions,
        catInds:this.objInds,
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
            <canvas className={"PredCanvas"} ref = {ref => this.predCanvas = ref}/>
            <canvas className={"ImgCanvas"} ref = {ref => this.imageCanvas = ref}/>
        </div>
      </div>
    );
  }

  protected async loadModel() {
      this.model = await tf.loadModel(Config.ModelPath);
      this.setState({isModelLoaded:true});
  }

  protected loadImgToCanvas() {
      this.setState({isProcessing:true});
      this.forceUpdate();
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
        this.setState({isProcessing:false});
  };

  protected loadPredToCanvas() {
    DrawToCanvasUtil.clearCanvas(this.predCanvas);
    this.objInds.forEach((e,i) => {
        if(e) {
            this.predictions[i].forEach((prediction:IDetected) => {
                DrawToCanvasUtil.drawPredictionRect(this.predCanvas, prediction , 2, this.colors[i], 12);
            });
        }
    });
  }

  protected async detect() {
      this.setState({isProcessing:true});
      this.forceUpdate();
      if( !this.state.areObjsDetected) {
          this.predictions = Array<IDetected[]>(categories.length);
          for(let i = 0;i<categories.length;i++) {this.predictions[i]=[]};
          await this.seperate();
          const allPreds = await this.predictAll(this.predRects)
          console.log(allPreds);
          allPreds.forEach( (p:IDetected) => {
            this.predictions[p.classID].push(p);            
          });
          this.setState({areObjsDetected:true})
          this.forceUpdate();
      }
    
      console.log(this.predictions)

    if(this.predictions !== null) {
        this.loadPredToCanvas();
    }
    this.setState({isProcessing:false});
  }
  protected async detect1() {
      /* TODO */
      if( !this.state.areObjsDetected) {
          this.predictions = Array<IDetected[]>(categories.length);
          for(let i = 0;i<categories.length;i++) {this.predictions[i]=[]};
          await this.seperate();
          let allPreds:IDetected[] = [];
          for( const area of this.predRects ) {
              const preds = await this.predict(area);
              console.log(preds);
              allPreds = allPreds.concat(preds);
          }
          console.log(allPreds);
          allPreds.forEach( (p:IDetected) => {
            this.predictions[p.classID].push(p);            
          });
          this.setState({areObjsDetected:true})
      }
    
      console.log(this.predictions)

    if(this.predictions !== null) {
        this.loadPredToCanvas();
    }
  }
  protected async detect2() {
    if( !this.state.areObjsDetected ) {
          this.predictions = Array<IDetected[]>(categories.length);
          for(let i = 0;i<categories.length;i++) {this.predictions[i]=[]};
          await this.drawPredRects();
          const allPreds = await this.predict(this.predictionsRect);
          console.log(allPreds);
          allPreds.forEach( (p:IDetected) => {
            this.predictions[p.classID].push(p);            
          });
          this.setState({areObjsDetected:true})
    }

    console.log(this.predictions)
    if(this.predictions !== null) {
        this.loadPredToCanvas();
    }
  }

  protected async seperate() {
        const major = Math.max(this.imageCanvas.width, this.imageCanvas.height);
        const minor = Math.min(this.imageCanvas.width, this.imageCanvas.height);
        // const numRects = (Math.ceil(major/minor)*2)-1;
        const majIsX:boolean = major === this.imageCanvas.width;

        this.predRects = [];
        let startInd = 0;
        let endInd = major-minor;
        let curRect:Rect;
        while(startInd<endInd) {
            curRect = majIsX ? new Rect(startInd,0,minor,minor) : new Rect(0,startInd,minor,minor);
            this.predRects.push(curRect)
            curRect = majIsX ? new Rect(endInd,0,minor,minor) : new Rect(0,endInd,minor,minor);
            this.predRects.push(curRect)
            startInd += minor;
            endInd -= minor;
        }
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
  protected async predict(area:Rect):Promise<IDetected[]> {
    // Load model settings from app settings
    const anchors = Config.ModelAnchors;
    const numClasses = Config.ModelClassCount;

    const imageData = this.imageCanvas.getContext("2d").getImageData(0, 0, this.imageCanvas.width, this.imageCanvas.height);

    const [allBoxes, boxConfidence, boxClassProbs] = await tf.tidy(() => {

        const pixels:tf.Tensor3D = tf.fromPixels(imageData, 3);
        const pixelsCropped:tf.Tensor3D = pixels.slice([area.y, area.x, 0], [this.maxPix, this.maxPix, 3]);
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
    // const ret:IDetected[][] = new Array<IDetected[]>(categories.length);
    // for(let i = 0; i<categories.length;i++) {ret[i]=[]}

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

    const ret = classesIndexArr.reduce( (results:IDetected[], classIndexValue:number, index:number) => {
        const classProbability = keepScores[index];
        if (classProbability < this.classProbThreshold) {
            return results;
        }

        const [top, left, bottom, right] = boxesArr[index];

        const x = Math.max(0, left);
        const y = Math.max(0, top);
        const w = Math.min(this.maxPix, right) - x;
        const h = Math.min(this.maxPix, bottom) - y;
        
        const nextObject:IDetected = {
            classID: classIndexValue,
            probability: classProbability,
            rect: new Rect(x+area.x, y+area.y, w, h)
        };

        return results.concat([nextObject]);
    },[]);
    console.log(area + " --> " + ret.length);
    return ret;
  }
  protected async predictOne(area:Rect,data:any,anchors:any,numClasses:any):Promise<tf.Tensor4D[]> {
    const offset:tf.Tensor1D = tf.tensor1d([area.x,area.y]).div(tf.tensor1d([area.height,area.width]))
    return await tf.tidy(() => {
        const pixels:tf.Tensor3D = tf.fromPixels(data, 3);
        const pixelsCropped:tf.Tensor3D = pixels.slice([area.y, area.x, 0], [this.maxPix, this.maxPix, 3]);
        let batchedImage:tf.Tensor4D = pixelsCropped.expandDims(0);
        batchedImage = batchedImage.toFloat().div(tf.scalar(255))

        const modelOutput:tf.Tensor4D = this.model.predict(batchedImage) as tf.Tensor4D;

        // console.log(tf.ENV);
        
        const [boxXY, boxWH, boxC, boxClassP] = ImgProcessingUtil.yoloHead(modelOutput, anchors, numClasses);
        console.log("xys are " + boxXY)
        const allB = ImgProcessingUtil.boxesToCorners(boxXY.add(offset), boxWH);

        console.log("predictOne : " + boxXY.shape + " : " + boxC.shape + " : " + boxClassP.shape);

        return [allB, boxC, boxClassP];
    })
  }
  protected async predictAll(areas:Rect[]):Promise<IDetected[]> {
    // Load model settings from app settings
    const anchors = Config.ModelAnchors;
    const numClasses = Config.ModelClassCount;
    const imageData = this.imageCanvas.getContext("2d").getImageData(0, 0, this.imageCanvas.width, this.imageCanvas.height);

    let allBoxes:tf.Tensor4D;
    let boxConfidence:tf.Tensor4D;
    let boxClassProbs:tf.Tensor4D;
    for( const area of this.predRects) {
        const [tempB,tempC,tempP] = await this.predictOne(area,imageData,anchors,numClasses);
        // allBoxes.concat()
        if(allBoxes == null) {
            [allBoxes,boxConfidence,boxClassProbs] = [tempB,tempC,tempP];
        }
        else {
            allBoxes = allBoxes.concat(tempB,2);
            boxConfidence = boxConfidence.concat(tempC,2);
            boxClassProbs = boxClassProbs.concat(tempP,2);
        }
    }

    const [origBoxes, scores, classes] = await ImgProcessingUtil.filterBoxes(
                                            allBoxes, boxConfidence, boxClassProbs, 0.01);
    let boxes = origBoxes;
    
    // 2d predictions array  
    // const ret:IDetected[][] = new Array<IDetected[]>(categories.length);
    // for(let i = 0; i<categories.length;i++) {ret[i]=[]}

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

    const ret = classesIndexArr.reduce( (results:IDetected[], classIndexValue:number, index:number) => {
        const classProbability = keepScores[index];
        if (classProbability < this.classProbThreshold) {
            return results;
        }

        const [top, left, bottom, right] = boxesArr[index];
        console.log(boxesArr[index]);

        const x = Math.max(0, left);
        const y = Math.max(0, top);
        const w = Math.min(this.maxPix, right) - x;
        const h = Math.min(this.maxPix, bottom) - y;
        
        const nextObject:IDetected = {
            classID: classIndexValue,
            probability: classProbability,
            rect: new Rect(x, y, w, h)
        };

        return results.concat([nextObject]);
    },[]);
    return ret;
  }
}

export default DetectionContainer;
