import * as tf from '@tensorflow/tfjs';
import * as React from "react";
import Classes from "./Classes"
import Config from "./Config"
import Control from "./Control"
import DrawToCanvas from "./Utils/DrawToCanvas";
import IObject from "./Utils/IObject"
import ModelOutputUtil from "./Utils/ModelOutputUtil"
import { Rect } from "./Utils/Rect"

interface IState {
    isModelLoaded: boolean,
    isFileLoaded: boolean,
    isDetecting: boolean,
    hasDetected: boolean,
    isSelectingRegion: boolean,
    isRegionSelected: boolean,
    sizeX: number,
    sizeY: number
};

export default class Detection extends React.Component<{}, IState>{

    // class related structures
    protected classes: string[];
    protected enabled: boolean[];
    protected colors: string[];

    protected trans: number[] = [0,0];
    protected scale: number = 1;
    protected origScale: number = -1;

    protected canvasRect:ClientRect;
    protected imageData:tf.Tensor3D;
    
    protected imageElement: HTMLImageElement = new Image();
    protected imageCanvas: HTMLCanvasElement;
    protected zoneCanvas: HTMLCanvasElement;
    protected selectedZone: Rect;
    protected model: tf.Model;
    protected predictions: IObject[][];

    protected maxDim = 800;

    protected dragging = false;
    protected startX = -1;
    protected startY = -1;
    protected prevX = -1;
    protected prevY = -1;

    protected optionHandlers: Array<(...args: any[]) => void> = [
        function openFile(e: any) {
            const fileURL: string = URL.createObjectURL(e.target.files[0]);
            this.imageElement.src = fileURL;
            this.setState({ isSelectingRegion: false, isRegionSelected: false });
            this.trans = [0,0];
            this.scale = 1;
            this.origScale = -1;
        },
        function changeClasses(i: number, addOrRemove: boolean) {
            this.enabled[i] = addOrRemove;
        },
        function selectRegion(e: any) {
            console.log(this.state.isSelectingRegion);
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
        this.classes = Classes;
        this.enabled = Classes.map(e => true);
        this.optionHandlers = this.optionHandlers.map(h => h.bind(this));
        this.state = {
            hasDetected: false,
            isDetecting: false,
            isFileLoaded: false,
            isModelLoaded: false,
            isRegionSelected: false,
            isSelectingRegion: false,
            sizeX: 0,
            sizeY: 0
        };
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
        this.colors = Classes.map(_ => (
            "rgb(" + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + ")"
        ));
        this.trans = [0,0];
        this.scale = 1;
    }

    public componentDidMount() {
        this.loadModel();
        this.imageElement.addEventListener('load', this.loadImage);
        this.canvasRect = this.zoneCanvas.getBoundingClientRect();
    }

    public async loadModel() {
        this.model = await tf.loadModel(Config.ModelPath);
        this.setState({ isModelLoaded: true });
    }

    public drawZone(endX:number,endY:number) {
        DrawToCanvas.clearCanvas(this.zoneCanvas);
        this.selectedZone = new Rect(this.startX, this.startY, endX - this.startX, endY - this.startY);
        DrawToCanvas.drawRect(this.zoneCanvas, this.selectedZone, "#000", 2);
        // this.setState({ isSelectingRegion: false, isRegionSelected: true, hasDetected: false });
        this.setState({ isSelectingRegion: true });
    }

    public loadImage() {
        // original size of image
        const fullH: number = this.imageElement.naturalHeight;
        const fullW: number = this.imageElement.naturalWidth;

        // set size of image on canvas based off of maximum dimensions allowed
        const ratio: number = fullH / fullW;
        let canvasH: number;
        let canvasW: number;
        if (fullW > fullH) {
            this.origScale = fullW/this.maxDim;
            canvasW = this.maxDim;
            canvasH = this.maxDim * ratio;
        }
        else {
            this.origScale = fullH/this.maxDim;
            canvasW = this.maxDim / ratio;
            canvasH = this.maxDim;
        }

        console.log(this.origScale);

        // draw image to canvas
        this.imageCanvas.width = canvasW;
        this.imageCanvas.height = canvasH;
        this.zoneCanvas.width = canvasW;
        this.zoneCanvas.height = canvasH;
        this.setState({ sizeX: canvasW, sizeY: canvasH });
        this.imageCanvas.getContext('2d').drawImage(this.imageElement, 0, 0, canvasW, canvasH);
        this.canvasRect = this.zoneCanvas.getBoundingClientRect();

        this.setState({ isFileLoaded: true });
        this.imageData = tf.fromPixels(this.imageElement,3);
        URL.revokeObjectURL(this.imageElement.src);
        console.log(this.imageData.print())
    }

    public mouseDown(event: any) {
        if (this.state.isSelectingRegion) {
            this.startX = event.clientX - this.canvasRect.left;
            this.startY = event.clientY - this.canvasRect.top;
        }
        else {
            this.prevX = event.clientX;
            this.prevY = event.clientY;
        }
        this.dragging = true;
        event.target.addEventListener('mousemove',this.mouseMove);
        event.target.addEventListener('mouseup',this.mouseUp);
        event.target.addEventListener('mouseleave',this.onLeave);
    }
    public setTrans(x,y,factor) {
        this.trans[0] = Math.max(0,Math.min(this.imageCanvas.width*(1-this.scale), this.trans[0]+(x*factor)));
        this.trans[1] = Math.max(0,Math.min(this.imageCanvas.height*(1-this.scale), this.trans[1]+(y*factor)));
        DrawToCanvas.clearCanvas(this.imageCanvas);
        // DrawToCanvas.clearCanvas(this.zoneCanvas);
        const ctx:CanvasRenderingContext2D = this.imageCanvas.getContext('2d');  
        ctx.save();
        ctx.scale(1/this.scale,1/this.scale)
        ctx.translate(-this.trans[0],-this.trans[1])
        ctx.drawImage(this.imageElement, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
        ctx.restore();
    }
    public translate(dx,dy) {
        if( dx===0 && dy===0) { return };
        this.setTrans(-dx,-dy,this.scale)
    }
    public zoom(isZoomIn:boolean,x:number,y:number) {
        if( this.scale < 0.05 && isZoomIn === true) { return };
        if( this.scale === 1 && isZoomIn === false) { return };
        const diff = isZoomIn ? -0.05 : 0.05;
        this.scale += diff;
        this.setTrans(x,y,-diff);
    }
    public mouseMove(event: any) {
        if (this.state.isSelectingRegion) {
            this.drawZone(event.clientX-this.canvasRect.left,event.clientY-this.canvasRect.top)
        }
        else {
            this.translate(event.clientX-this.prevX,event.clientY-this.prevY)
            this.prevX = event.clientX;
            this.prevY = event.clientY;
        }
    }
    public finalizeZone() {
        const [x,y,w,h] = this.selectedZone.getDetails();
        if( w<0 ) {
            this.selectedZone.x = x+w;
            this.selectedZone.w = -w;
        }
        if( h<0 ) {
            this.selectedZone.y = y+h;
            this.selectedZone.h = -h;
        }
        this.setState({isSelectingRegion:false,isRegionSelected:true});
    }
    public mouseUp(event: any) {
        if (this.state.isSelectingRegion) {
            this.finalizeZone();
        }
        event.target.removeEventListener('mousemove',this.mouseMove);
        event.target.removeEventListener('mouseup',this.mouseUp);
        event.target.removeEventListener('mouseleave',this.onLeave);
    }
    public handleScroll(event: any) {
        this.zoom(event.deltaY<0,event.clientX-this.canvasRect.left,event.clientY-this.canvasRect.top)
    }

    public async predict(zone: Rect) {
        // Load model settings from app settings
        const anchors = Config.ModelAnchors;
        const numClasses = Config.ModelClassCount;

        const newX = this.trans[0] + (zone.x*this.scale);
        const newY = this.trans[1] + (zone.y*this.scale);
        const newH = zone.h*this.scale;
        const newW = zone.w*this.scale;

        const origX = newX*this.origScale;
        const origY = newY*this.origScale;
        const origW = newW*this.origScale;
        const origH = newH*this.origScale;

        const [allBoxes, boxConfidence, boxClassProbs] = await tf.tidy(() => {
            let pixelsCropped: tf.Tensor3D = this.imageData.slice([origY, origX, 0], [origH, origW, 3]);
            pixelsCropped = pixelsCropped.resizeBilinear([Config.ModelInputPixelSize, Config.ModelInputPixelSize], true);
            let batchedImage: tf.Tensor4D = pixelsCropped.expandDims(0);
            batchedImage = batchedImage.toFloat().div(tf.scalar(255))

            const modelOutput: tf.Tensor4D = this.model.predict(batchedImage) as tf.Tensor4D;

            // console.log(tf.ENV);

            const [boxXY, boxWH, boxC, boxClassP] = ModelOutputUtil.yoloHead(modelOutput, anchors, numClasses);
            const allB = ModelOutputUtil.boxesToCorners(boxXY, boxWH);

            return [allB, boxC, boxClassP];
        });

        const [origBoxes, scores, classes] = await ModelOutputUtil.filterBoxes(
            allBoxes, boxConfidence, boxClassProbs, 0.01);
        let boxes = origBoxes;

        // 2d predictions array  
        // const ret:IDetected[][] = new Array<IDetected[]>(categories.length);
        // for(let i = 0; i<categories.length;i++) {ret[i]=[]}

        // If all boxes have been filtered out
        if (boxes == null) {
            return [];
        }

        const width = tf.scalar(Config.ModelInputPixelSize);
        const height = tf.scalar(Config.ModelInputPixelSize);

        const imageDims = tf.stack([height, width, height, width]).reshape([1, 4]);

        boxes = tf.mul(boxes, imageDims);

        const [preKeepBoxesArr, scoresArr] = await Promise.all([
            boxes.data(), scores.data(),
        ]);

        const [keepIndx, boxesArr, keepScores] = ModelOutputUtil.nonMaxSuppression(
            preKeepBoxesArr,
            scoresArr,
            Config.ModelIouThreshold
        );

        const classesIndexArr = await classes.gather(tf.tensor1d(keepIndx, 'int32')).data();

        const ratioX = newW/Config.ModelInputPixelSize;
        const ratioY = newH/Config.ModelInputPixelSize;

        const ret = classesIndexArr.reduce((results: IObject[], classIndexValue: number, index: number) => {
            const classProbability = keepScores[index];
            if (classProbability < Config.ModelClassProbThreshold) {
                return results;
            }

            const [top, left, bottom, right] = boxesArr[index];

            const x = Math.max(0, left)*ratioX;
            const y = Math.max(0, top)*ratioY;
            const w = Math.min(Config.ModelInputPixelSize, right*ratioX) - x;
            const h = Math.min(Config.ModelInputPixelSize, bottom*ratioY) - y;

            const nextObject: IObject = {
                classID: classIndexValue,
                probability: classProbability,
                rect: new Rect(x + newX, y + newY, w, h)
            };

            return results.concat([nextObject]);
        }, []);
        console.log("Zone ",newX,newY,newW,newH," --> ",ret.length);
        return ret;
    }

    public drawPredsToZone() {
        // DrawToCanvas.clearCanvas(this.zoneCanvas);
        this.enabled.forEach((e,i) => {
            if(e) {
                this.predictions[i].forEach((prediction:IObject) => {
                    DrawToCanvas.drawPredictionRect(this.zoneCanvas, this.classes[i], prediction, 2, this.colors[i], 12);
                })
            }
        });
    }

    public async detect() {
        this.setState({ isDetecting: true });
        this.forceUpdate();
        if (!this.state.hasDetected) {
            this.predictions = Array<IObject[]>(this.classes.length);
            for (let i = 0; i < this.classes.length; i++) { this.predictions[i] = [] };
            console.log(this.predictions);
            // await this.seperate();
            const allPreds:IObject[] = await this.predict(this.selectedZone)
            allPreds.forEach(e => {
                this.predictions[e.classID].push(e);
            });
            this.setState({ hasDetected: true })
        }

        this.drawPredsToZone();
        this.setState({ isDetecting: false });
        this.forceUpdate();
    }

    public onLeave(event: any) {
        if (this.state.isSelectingRegion) {
            this.finalizeZone();
        }
        event.target.removeEventListener('mousemove',this.mouseMove);
        event.target.removeEventListener('mouseup',this.mouseUp);
        event.target.removeEventListener('mouseleave',this.onLeave);
    };

    public render() {

        const optionsEnabled: boolean[] = [
            this.state.isModelLoaded,
            true,
            this.state.isFileLoaded,
            this.state.isSelectingRegion,
            this.state.isRegionSelected && this.state.isSelectingRegion === false
        ];


        const controlProps: any = {
            classStrings: this.classes.slice(0,10),
            classesEnabled: this.enabled,
            optionHandlers: this.optionHandlers,
            optionsEnabled,
        }

        return (
            <div className="Detection">
                <header className="Header">
                    <h1 className="Title">Object Detector</h1>
                    <Control {...controlProps} />
                </header>
                <div className="Canvases" style={{ height: this.state.sizeY, width: this.state.sizeX }}>
                    <canvas className="ImageCanvas" ref={ref => this.imageCanvas = ref} />
                    <canvas className="ZoneCanvas" ref={ref => this.zoneCanvas = ref} onMouseDown={this.mouseDown} onWheel={this.handleScroll}/>
                </div>
            </div>
        );
    }

}
                    // <canvas className="ZoneCanvas" ref = {ref => this.zoneCanvas = ref}/> //onMouseDown={this.startSelect} onMouseUp={this.endSelect}/>