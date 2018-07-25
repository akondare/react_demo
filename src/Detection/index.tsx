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

    protected imageElement: HTMLImageElement = new Image();
    protected imageCanvas: HTMLCanvasElement;
    protected zoneCanvas: HTMLCanvasElement;
    protected selectedZone: Rect;
    protected model: tf.Model;
    protected predictions: IObject[][];

    protected maxDim = 1000;

    protected selecting = false;
    protected startX = -1;
    protected startY = -1;
    protected endX = -1;
    protected endY = -1;

    protected optionHandlers: Array<(...args: any[]) => void> = [
        function openFile(e: any) {
            const fileURL: string = URL.createObjectURL(e.target.files[0]);
            this.imageElement.src = fileURL;
            this.setState({ isSelectingRegion: false, isRegionSelected: false });
        },
        function changeClasses(i: number, addOrRemove: boolean) {
            this.enabled[i] = addOrRemove;
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
            console.log('calling detect from handler');
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
        this.startSelect = this.startSelect.bind(this)
        this.endSelect = this.endSelect.bind(this)
        this.drawZone = this.drawZone.bind(this)
        this.detect = this.detect.bind(this)
        this.colors = Classes.map(_ => (
            "rgb(" + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + ")"
        ));
        console.log(this.classes);
    }

    public componentDidMount() {
        this.loadModel();
        this.imageElement.addEventListener('load', this.loadImage);
    }

    public async loadModel() {
        this.model = await tf.loadModel(Config.ModelPath);
        this.setState({ isModelLoaded: true });
    }

    public drawZone() {
        DrawToCanvas.clearCanvas(this.zoneCanvas);
        this.selectedZone = new Rect(this.startX, this.startY, this.endX - this.startX, this.endY - this.startY);
        DrawToCanvas.drawRect(this.zoneCanvas, this.selectedZone, "#000", 2);
        this.setState({ isSelectingRegion: false, isRegionSelected: true });
        console.log("Selected Zone is ", this.selectedZone);
    }

    public loadImage() {
        console.log("called");
        // original size of image
        const fullH: number = this.imageElement.naturalHeight;
        const fullW: number = this.imageElement.naturalWidth;

        // set size of image on canvas based off of maximum dimensions allowed
        const ratio: number = fullH / fullW;
        let canvasH: number;
        let canvasW: number;
        if (fullW > fullH) {
            canvasW = this.maxDim;
            canvasH = this.maxDim * ratio;
        }
        else {
            canvasW = this.maxDim / ratio;
            canvasH = this.maxDim;
        }

        // draw image to canvas
        this.imageCanvas.width = canvasW;
        this.imageCanvas.height = canvasH;
        this.zoneCanvas.width = canvasW;
        this.zoneCanvas.height = canvasH;
        this.setState({ sizeX: canvasW, sizeY: canvasH });
        this.imageCanvas.getContext('2d').drawImage(this.imageElement, 0, 0, canvasW, canvasH);

        this.setState({ isFileLoaded: true });
    }

    public startSelect(event: any) {
        if (this.state.isSelectingRegion === false) { return }
        const rect = this.zoneCanvas.getBoundingClientRect();
        this.selecting = true;
        this.startX = event.clientX - rect.left;
        this.startY = event.clientY - rect.top;
    }
    public endSelect(event: any) {
        if (this.state.isSelectingRegion === false) { return }
        if (this.selecting && this.startX !== event.clientX && this.startY !== event.clientY) {
            const rect = this.zoneCanvas.getBoundingClientRect();
            this.selecting = false;
            this.endX = event.clientX - rect.left;
            this.endY = event.clientY - rect.top;
            this.drawZone();
            console.log(this.startX, this.startY, this.endX, this.endY);
        }
    }

    public async predict(zone: Rect) {
        // Load model settings from app settings
        console.log("Zone is ",zone)
        const anchors = Config.ModelAnchors;
        const numClasses = Config.ModelClassCount;
        const imageData = this.imageCanvas.getContext("2d").getImageData(0, 0, this.imageCanvas.width, this.imageCanvas.height);

        const [allBoxes, boxConfidence, boxClassProbs] = await tf.tidy(() => {
            const pixels: tf.Tensor3D = tf.fromPixels(imageData, 3);
            console.log(pixels.shape);
            let pixelsCropped: tf.Tensor3D = pixels.slice([zone.y, zone.x, 0], [zone.h, zone.w, 3]);
            console.log(pixelsCropped.shape);
            pixelsCropped = pixelsCropped.resizeBilinear([Config.ModelInputPixelSize, Config.ModelInputPixelSize], true);
            console.log(pixelsCropped.shape);
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

        const ratioX = zone.w/Config.ModelInputPixelSize;
        const ratioY = zone.h/Config.ModelInputPixelSize;

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
                rect: new Rect(x + zone.x, y + zone.y, w, h)
            };

            return results.concat([nextObject]);
        }, []);
        console.log(zone + " --> " + ret.length);
        return ret;
    }

    public drawPredsToZone() {
        DrawToCanvas.clearCanvas(this.zoneCanvas);
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

    public render() {

        const optionsEnabled: boolean[] = [
            this.state.isModelLoaded,
            true,
            this.state.isFileLoaded,
            this.state.isSelectingRegion,
            this.state.isRegionSelected && this.state.isSelectingRegion === false
        ];

        console.log(this.state);

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
                    <canvas className="ZoneCanvas" ref={ref => this.zoneCanvas = ref} onMouseDown={this.startSelect} onMouseUp={this.endSelect} />
                </div>
            </div>
        );
    }

}
                    // <canvas className="ZoneCanvas" ref = {ref => this.zoneCanvas = ref}/> //onMouseDown={this.startSelect} onMouseUp={this.endSelect}/>