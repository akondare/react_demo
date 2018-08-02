import * as tf from '@tensorflow/tfjs';
import * as React from "react";
import Classes from "./Classes"
import {Config,v3} from "./Config"
import Control from "./Control"
import DrawToCanvas from "./Utils/DrawToCanvas";
import IObject from "./Utils/IObject"
import ModelOutputUtil from "./Utils/ModelOutputUtil"
import { Rect } from "./Utils/Rect"

interface ISize {
    w: number,
    h: number
}
interface IState {
    isModelLoaded: boolean,
    isFileLoaded: boolean,
    isDetecting: boolean,
    hasDetected: boolean,
    isSelectingRegion: boolean,
    isRegionSelected: boolean,
    size:ISize,
    enabled:boolean[]
};

export default class Detection extends React.Component<{}, IState>{

    /* class related structures (define classes of model in Classes.js)
        classes - strings of object classes
        enabled - whether or not each class detection is enabled
        colors - the colors used to view classes 
    */
    protected classes: string[] = Classes;
    protected colors: string[] = Classes.map(_ => (
        "rgb(" + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + ")"
    ));

    /* holds transformations relative to loaded image 
        trans - the top left cornner of the canvas relative to pixel (0,0) of the original image
        scale - the scale of the current view relative to zoomed-out canvas view
        origScale - the scale of the zoomed-out canvas view relative to the original image
    */
    protected trans: number[] = [0, 0];
    protected scale: number = 1;
    protected origScale: number = null;

    /* state of canvas
        imageElement - current image file loaded
        imageCanvas - canvas that image is drawn to 
        zoneCanvas - canvas, overlaying the imageCanvas, where zone and its predictions are drawn to 
        canvasRect - pixel coordinates of the top left corner of the canvases relative to the client window
    */
    protected imageElement: HTMLImageElement = new Image();
    protected imageCanvas: HTMLCanvasElement;
    protected zoneCanvas: HTMLCanvasElement;
    protected canvasSize = {x:0,y:0}
    protected canvasRect: number[] = [0,0];

    /* state of detection
        selectedZone - (x,y,w,h) of rectangle selected for detection relative to the canvas image
        model - tf model loaded by tfjs from Config.ModelPath upon component mount
        predictions - holds list of bounding boxes (x,y,w,h) per class  
    */
    protected selectedZone: Rect;
    protected model: tf.Model;
    protected predictions: IObject[][];

    protected maxDim = 800;

    /* State of user interaction with canvas 
        start - (x,y) of starting position as mouse presses down on canvas
        prev - (x,y) of previous point as mouse drags over canvas
    */
    protected startX = -1;
    protected startY = -1;
    protected prevX = -1;
    protected prevY = -1;

    /* event handlers to pass along to Control Component 
        openFile - opens file 
        changeClasses - toggle detection of class
        selectRegion - toggle using mouse to select region once file is loaded
        detect - run detection on selectd region once model is loaded
    */
    protected optionHandlers: Array<(...args: any[]) => void> = [
        function openFile(e: any) {
            const fileURL: string = URL.createObjectURL(e.target.files[0]);
            this.imageElement.src = fileURL;
            this.setState({ isSelectingRegion: false, isRegionSelected: false });
            this.trans = [0, 0];
            this.scale = 1;
            this.origScale = -1;
        },
        function changeClasses(i: number, addOrRemove: boolean) {
            const newEnabled:boolean[] = this.state.enabled; 
            newEnabled[i] = addOrRemove;
            if(this.state.hasDetected) {
                this.drawPredsToZone();
            }
            this.setState({enabled: newEnabled});
        },
        function selectRegion(e: any) {
            if (this.state.isSelectingRegion === false) {
                this.setState({ isSelectingRegion: true });
            }
            else {
                this.setState({ isSelectingRegion: false });
            }
        },
        function detect(e: any) {
            this.detect();
        },
    ];

    constructor(props: {}) {
        super(props);

        // set all booleans to false since nothing has occured yet and set empty canvas to size of (0,0)
        this.state = {
            enabled: Classes.map(_ => true),
            hasDetected: false,
            isDetecting: false,
            isFileLoaded: false,
            isModelLoaded: false,
            isRegionSelected: false,
            isSelectingRegion: false,
            size: {w:0,h:0}
        };

        /* bind all functions called by event handlers */
        this.optionHandlers = this.optionHandlers.map(h => h.bind(this));
        this.loadImage = this.loadImage.bind(this);
        this.setTrans = this.setTrans.bind(this);
        this.mouseDown = this.mouseDown.bind(this)
        this.mouseUp = this.mouseUp.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.zoom = this.zoom.bind(this);
        this.drawZone = this.drawZone.bind(this)
        this.detect = this.detect.bind(this)
        this.onLeave = this.onLeave.bind(this)
    }

    /*  componentDidMount() 
            Upon component being mounted, start loading the model asynchronously, and add event handler to load image to canvas upon availability
    */
    public componentDidMount() {
        this.loadModel();
        this.imageElement.addEventListener('load', this.loadImage);
    }

    public render() {

        // recalculate whether each option is currently enabled based upon the state of the detector
        const optionsEnabled: boolean[] = [
            true,// this.state.isModelLoaded,
            true,
            this.state.isFileLoaded,
            this.state.isSelectingRegion,
            this.state.isRegionSelected && this.state.isSelectingRegion === false && this.state.hasDetected === false && this.state.isModelLoaded
        ];

        // pass information, event handlers, and optionsEnabled array to Control component 
        const controlProps: any = {
            classStrings: this.classes.slice(0, 10),
            classesEnabled: this.state.enabled,
            optionHandlers: this.optionHandlers,
            optionsEnabled,
        }

        // render Header with title and control component along with div holding canvases
        return (
            <div className="Detection">
                <header className="Header">
                    <h1 className="Title">Object Detector</h1>
                    <Control {...controlProps} />
                </header>
                <div className="Canvases" style={{ height: this.state.size.h, width: this.state.size.w }}>
                    <canvas className="ImageCanvas" ref={ref => this.imageCanvas = ref} />
                    <canvas className="ZoneCanvas" ref={ref => this.zoneCanvas = ref} onMouseDown={this.mouseDown} onWheel={this.handleScroll} />
                </div>
            </div>
        );
    }

    // loads model from Config.ModelPath asynchronously
    protected async loadModel() {
        // tf.setBackend('cpu');
        this.model = await tf.loadModel(Config.ModelPath);
        this.setState({ isModelLoaded: true });
    }

    // draw zone to canvas as it is being selected with respect to current view only
    protected drawZone(endX: number, endY: number) {
        DrawToCanvas.clearCanvas(this.zoneCanvas);

        this.selectedZone = new Rect(this.startX, this.startY, endX - this.startX, endY - this.startY);
        DrawToCanvas.drawRect(this.zoneCanvas, this.selectedZone, "#000", 2);

        this.setState({ isSelectingRegion: true });
    }

    // load image to canvas upon availability from file input handler
    protected loadImage() {

        // original size of image
        const fullH: number = this.imageElement.naturalHeight;
        const fullW: number = this.imageElement.naturalWidth;

        // set size of image on canvas based off of maximum dimensions allowed
        const ratio: number = fullH / fullW;
        let canvasH: number;
        let canvasW: number;
        if (fullW > fullH) {
            this.origScale = fullW / this.maxDim;
            canvasW = this.maxDim;
            canvasH = this.maxDim * ratio;
        }
        else {
            this.origScale = fullH / this.maxDim;
            canvasW = this.maxDim / ratio;
            canvasH = this.maxDim;
        }

        // draw image to canvas
        this.imageCanvas.width = canvasW;
        this.imageCanvas.height = canvasH;
        this.zoneCanvas.width = canvasW;
        this.zoneCanvas.height = canvasH;
        this.setState({size:{w:canvasW, h:canvasH}});
        this.imageCanvas.getContext('2d').drawImage(this.imageElement, 0, 0, canvasW, canvasH);

        // record position of canvas relative to client window
        const cRect:ClientRect = this.zoneCanvas.getBoundingClientRect();
        this.canvasRect = [cRect.left, cRect.top]

        // delete memory of object url of original file as it has been loaded into the image element
        URL.revokeObjectURL(this.imageElement.src);

        // image loading complete
        this.setState({ isFileLoaded: true });
    }

    protected mouseDown(event: any) {
        if (this.state.isSelectingRegion) {
            this.startX = (event.clientX - this.canvasRect[0])
            this.startY = (event.clientY - this.canvasRect[1])
        }
        else {
            this.prevX = event.clientX;
            this.prevY = event.clientY;
        }
        event.target.addEventListener('mousemove', this.mouseMove);
        event.target.addEventListener('mouseup', this.mouseUp);
        event.target.addEventListener('mouseleave', this.onLeave);
    }
    protected mouseMove(event: any) {
        if (this.state.isSelectingRegion) {
            const endX: number = (event.clientX - this.canvasRect[0])
            const endY: number = (event.clientY - this.canvasRect[1])
            this.drawZone(endX, endY);
        }
        else {
            this.translate(event.clientX - this.prevX, event.clientY - this.prevY)
            this.prevX = event.clientX;
            this.prevY = event.clientY;
        }
    }
    protected mouseUp(event: any) {
        if (this.state.isSelectingRegion) {
            this.finalizeZone();
        }
        event.target.removeEventListener('mousemove', this.mouseMove);
        event.target.removeEventListener('mouseup', this.mouseUp);
        event.target.removeEventListener('mouseleave', this.onLeave);
    }
    protected handleScroll(event: any) {
        this.zoom(event.deltaY < 0, event.clientX - this.canvasRect[0], event.clientY - this.canvasRect[1])
    }


    protected setTrans(x, y, factor) {
        this.trans[0] = Math.max(0, Math.min(this.imageCanvas.width * (1 - this.scale), this.trans[0] + (x * factor)));
        this.trans[1] = Math.max(0, Math.min(this.imageCanvas.height * (1 - this.scale), this.trans[1] + (y * factor)));
        DrawToCanvas.clearCanvas(this.imageCanvas);
        // DrawToCanvas.clearCanvas(this.zoneCanvas);
        const ctx: CanvasRenderingContext2D = this.imageCanvas.getContext('2d');
        ctx.save();
        ctx.scale(1 / this.scale, 1 / this.scale)
        ctx.translate(-this.trans[0], -this.trans[1])
        ctx.drawImage(this.imageElement, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
        ctx.restore();
        this.drawPredsToZone();
    }
    protected translate(dx, dy) {
        if (dx === 0 && dy === 0) { return };
        this.setTrans(-dx, -dy, this.scale)
    }
    protected zoom(isZoomIn: boolean, x: number, y: number) {
        if (this.scale < 0.05 && isZoomIn === true) { return };
        if (this.scale === 1 && isZoomIn === false) { return };
        const diff = isZoomIn ? -0.05 : 0.05;
        this.scale += diff;
        this.setTrans(x, y, -diff);
    }
    protected finalizeZone() {
        let [x, y, w, h] = this.selectedZone.getDetails();
        if (w < 0) {
            x = x + w;
            w = -w;
        }
        if (h < 0) {
            y = y + h;
            h = -h;
        }

        this.selectedZone.x = this.trans[0] + (x * this.scale)
        this.selectedZone.y = this.trans[1] + (y * this.scale)
        this.selectedZone.w = (w * this.scale)
        this.selectedZone.h = (h * this.scale)

        this.setState({ isSelectingRegion: false, isRegionSelected: true, hasDetected: false });
    }

    protected getPixelData(x, y, w, h):tf.Tensor4D {
        // tf resize
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const context: CanvasRenderingContext2D = canvas.getContext('2d');
        canvas.width = w;
        canvas.height = h;
        context.drawImage(this.imageElement,x,y,w,h,0,0,w,h)
        return tf.fromPixels(context.getImageData(0,0,w,h))
                 .resizeBilinear([Config.ModelInputPixelSize, Config.ModelInputPixelSize], true)
                 .expandDims(0)
                 .toFloat().div(tf.scalar(255));

        // alternate implementations 
        /*
        // canvas resize 
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const context: CanvasRenderingContext2D = canvas.getContext('2d');
        const inputSize: number = Config.ModelInputPixelSize;
        canvas.width = inputSize;
        canvas.height = inputSize;
        context.drawImage(this.imageElement, x, y, w, h, 0, 0, inputSize, inputSize)
        return tf.fromPixels(context.getImageData(0, 0, inputSize, inputSize)).expandDims(0).toFloat().div(tf.scalar(255));
        */
        /*
        // one read solution
        let pixelsCropped: tf.Tensor3D = this.imageData.slice([origY, origX, 0], [origH, origW, 3]);
        return pixelsCropped.resizeBilinear([Config.ModelInputPixelSize, Config.ModelInputPixelSize], true);
        */
    }

    protected async predict(zone: Rect) {
        const [x,y,w,h] = [
            Math.floor(zone.x * this.origScale),
            Math.floor(zone.y * this.origScale),
            Math.ceil(zone.w * this.origScale),
            Math.ceil(zone.h * this.origScale),
        ];

        // get detections by running inference, filtering by score, and then apply non maximum suppression
        const [allB,allC,allP] = tf.tidy(()=>this.runInference(x,y,w,h));
        const [preB,preS,preC] = tf.tidy(()=>this.filterBoxes(allB,allC,allP, 0.01));
        if (preB==null) {
            return []
        };

        const [boxes,scores,classes] = await this.nms(preB,preS,preC);

        // transfer data from tensors in gpu memory to cpu
        const [boxArr,scoresArr,classesArr] = await Promise.all([
            boxes.data(),
            scores.data(),
            classes.data(),
        ]) 

        // dispose of all variables in this scope
        allB.dispose();
        allC.dispose();
        allP.dispose();
        preB.dispose();
        preS.dispose();
        preC.dispose();
        boxes.dispose();
        scores.dispose();
        classes.dispose();


        // filter by class probability and convert to adaptable format
        const results:IObject[] = this.getFinalPreds(boxArr,scoresArr,classesArr,zone)
        return results;
    }

    protected runInference(x,y,w,h) {
        const input: tf.Tensor4D = this.getPixelData(x, y, w, h);
        const modelOutput: tf.Tensor4D = this.model.predict(input) as tf.Tensor4D;

        console.log(modelOutput.shape)

        const postProc:any = v3 ? ModelOutputUtil.yolo3Head : ModelOutputUtil.yoloHead;  
        const [boxXY, boxWH, boxC, boxClassP] = postProc(modelOutput, Config.ModelAnchors, Config.ModelClassCount);
        const allB = ModelOutputUtil.boxesToCorners(boxXY, boxWH);
        return [allB, boxC, boxClassP];
    }
    protected filterBoxes(boxes,confs,probs,threshold){
        const boxScores = tf.mul(confs, probs);
        const boxClasses = tf.argMax(boxScores, -1);
        const boxClassScores = tf.max(boxScores, -1);
      
        const predictionMask = tf.greaterEqual(boxClassScores, tf.scalar(threshold)).as1D();
      
        const N = predictionMask.size
        // linspace start/stop is inclusive.
        const allIndices = tf.linspace(0, N - 1, N).toInt();
        const negIndices = tf.zeros([N], 'int32');
        const indices:any = tf.where(predictionMask, allIndices, negIndices);
      
        return [
          tf.gather(boxes.reshape([N, 4]), indices),
          tf.gather(boxClassScores.flatten(), indices),
          tf.gather(boxClasses.flatten(), indices),
        ];
    }
    protected async nms(boxes,scores,classes) {
        const width = tf.scalar(Config.ModelInputPixelSize);
        const height = tf.scalar(Config.ModelInputPixelSize);
        const dims = tf.stack([height, width, height, width]).reshape([1,4]);
        boxes = tf.mul(boxes, dims);
        width.dispose()
        height.dispose()
        dims.dispose()

        const maxOutputSize = Infinity;
        const scoreThreshold = null;
        const indices:tf.Tensor1D = await tf.image.nonMaxSuppressionAsync(boxes,scores,maxOutputSize,Config.ModelIouThreshold,scoreThreshold);
        const final =  [
          tf.gather(boxes, indices),
          tf.gather(scores, indices),
          tf.gather(classes, indices),
        ];
        indices.dispose();
        return final;
    }
    protected getFinalPreds(boxes,scores,classes,zone) {
        const ratioX = zone.w / Config.ModelInputPixelSize;
        const ratioY = zone.h / Config.ModelInputPixelSize;
        const results:IObject[] = [];

        for(let i = 0; i<boxes.length;i++) {
            const [top,left,bottom,right] = boxes.slice(i*4,(i+1)*4);
            const prob = scores[i];
            const classId = classes[i];

            if (prob < Config.ModelClassProbThreshold) {
                break;
            }

            const x = Math.max(0, left) * ratioX;
            const y = Math.max(0, top) * ratioY;
            const w = Math.min(Config.ModelInputPixelSize, right * ratioX) - x;
            const h = Math.min(Config.ModelInputPixelSize, bottom * ratioY) - y;

            const nextObject: IObject = {
                classID: classId,
                probability: prob,
                rect: new Rect(x+zone.x, y+zone.y, w, h)
            };

            results.push(nextObject);
        }

        console.log(results);
        return results;
    }

    protected drawPredsToZone() {
        if (this.state.isRegionSelected === false) { return }
        DrawToCanvas.clearCanvas(this.zoneCanvas);
        const ctx: CanvasRenderingContext2D = this.zoneCanvas.getContext('2d');
        ctx.save();

        ctx.scale(1 / this.scale, 1 / this.scale)
        ctx.translate(-this.trans[0], -this.trans[1])

        DrawToCanvas.drawRect(this.zoneCanvas, this.selectedZone, "#000", 2);
        if (this.state.hasDetected === true) {
            this.state.enabled.forEach((e, i) => {
                if (e) {
                    this.predictions[i].forEach((prediction: IObject) => {
                        DrawToCanvas.drawPredictionRect(this.zoneCanvas, this.classes[i], prediction, 2, this.colors[i], 12);
                    })
                }
            });
        }

        ctx.restore();
    }

    protected async detect() {
        this.setState({ isDetecting: true });
        this.forceUpdate();

        if (!this.state.hasDetected) {
            this.predictions = Array<IObject[]>(this.classes.length);
            for (let i = 0; i < this.classes.length; i++) { this.predictions[i] = [] };

            console.log("Memory Before", tf.memory().numTensors);
            const allPreds: IObject[] = await this.predict(this.selectedZone)
            console.log("Memory After", tf.memory().numTensors);

            allPreds.forEach((e,i) => {
                this.predictions[e.classID].push(e);
                const origE:IObject = {
                    classID: e.classID,
                    probability: e.probability,
                    rect: new Rect(e.rect.x*this.origScale,e.rect.y*this.origScale,e.rect.w*this.origScale,e.rect.h*this.origScale)
                }
                console.log(i,origE);
            });
            this.setState({ hasDetected: true })
        }

        this.drawPredsToZone();
        this.setState({ isDetecting: false });
        this.forceUpdate();
    }

    protected onLeave(event: any) {
        if (this.state.isSelectingRegion) {
            this.finalizeZone();
        }
        event.target.removeEventListener('mousemove', this.mouseMove);
        event.target.removeEventListener('mouseup', this.mouseUp);
        event.target.removeEventListener('mouseleave', this.onLeave);
    };


}
                    // <canvas className="ZoneCanvas" ref = {ref => this.zoneCanvas = ref}/> //onMouseDown={this.startSelect} onMouseUp={this.endSelect}/>