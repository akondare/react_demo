import * as React from "react";
import Classes from "./Classes"

import Control from "./Control"
import DrawToCanvas from "./Utils/DrawToCanvas";
import {Rect} from "./Utils/Rect"

interface IState {
    isModelLoaded:boolean,
    isFileLoaded:boolean,
    isSelectingRegion:boolean,
    isRegionSelected:boolean,
};

export default class Detection extends React.Component<{},IState>{

    // class related structures
    protected classes:string[];
    protected enabled:boolean[];

    protected imageElement:HTMLImageElement = new Image();
    protected imageCanvas:HTMLCanvasElement;
    protected zoneCanvas:HTMLCanvasElement;

    protected maxDim = 800;

    protected selecting = false;
    protected startX = -1;
    protected startY = -1;
    protected endX = -1;
    protected endY = -1;

    protected optionHandlers:Array<(...args:any[]) => void> = [
        function openFile(e:any){
            const fileURL:string = URL.createObjectURL(e.target.files[0]);
            this.imageElement.src = fileURL;
        }, 
        function changeClasses(i:number,addOrRemove:boolean){
            this.enabled[i] = addOrRemove;
        }, 
        function selectRegion(e:any){
            console.log("called select");
        }, 
        function detect(e:any){
            console.log("called detect");
        }, 
    ];
    
    constructor(props:{}) {
        super(props);
        this.classes = Classes;
        this.enabled = Classes.map(e => true); 
        this.optionHandlers = this.optionHandlers.map(h => h.bind(this));
        this.state = {
            isFileLoaded:false,
            isModelLoaded:true,
            isRegionSelected:false,
            isSelectingRegion:false,
        };
        this.loadImage = this.loadImage.bind(this);
        this.imageElement.addEventListener('load',this.loadImage);
        this.startSelect = this.startSelect.bind(this)
        this.endSelect = this.endSelect.bind(this)
        this.drawZone = this.drawZone.bind(this)
    }

    public drawZone() {
        DrawToCanvas.clearCanvas(this.zoneCanvas);
        const rect:Rect = new Rect(this.startX,this.startY,this.endX-this.startX,this.endY-this.startY);
        DrawToCanvas.drawRect(this.zoneCanvas,rect,"#fff",2);
        this.forceUpdate();
    }

    public loadImage() {
        console.log("called");
        // original size of image
        const fullH:number = this.imageElement.naturalHeight;
        const fullW:number = this.imageElement.naturalWidth;

        // set size of image on canvas based off of maximum dimensions allowed
        const ratio:number = fullH / fullW;
        let canvasH:number;
        let canvasW:number;
        if( fullW > fullH ) {
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
        this.imageCanvas.getContext('2d').drawImage(this.imageElement,0,0,canvasW,canvasH);

        this.setState({isFileLoaded:true});
    }

    public startSelect(event:React.MouseEvent<HTMLCanvasElement>) {
        const rect = this.zoneCanvas.getBoundingClientRect();
        this.selecting = true;
        this.startX =event.clientX-rect.left;
        this.startY =event.clientY-rect.top;
    }
    public endSelect(event:any) {
        if( this.selecting && this.startX !== event.clientX && this.startY !== event.clientY ) {
            const rect = this.zoneCanvas.getBoundingClientRect();
            this.selecting = true;
            this.endX = event.clientX-rect.left;
            this.endY = event.clientY-rect.top;
            this.drawZone();
            console.log(this.startX,this.startY,this.endX,this.endY)
        }
        else {
            this.startX = -1;
            this.startY = -1;
        }
    }

    public render() {

        const optionsEnabled:boolean[] = [
            this.state.isModelLoaded,
            true,
            this.state.isFileLoaded && this.state.isSelectingRegion===false,
            this.state.isRegionSelected  && this.state.isSelectingRegion===false
        ];

        const controlProps:any = {
            classStrings:this.classes,
            classesEnabled: this.enabled,
            optionHandlers: this.optionHandlers,
            optionsEnabled, 
        }

        return (
            <div className="Detection">
                <Control {...controlProps} />
                <div className="Canvases">
                    <canvas className="ImageCanvas" ref = {ref => this.imageCanvas = ref} />
                    <canvas className="ZoneCanvas" ref = {ref => this.zoneCanvas = ref} onPointerDown={this.startSelect} onPointerUp={this.endSelect}/>
                </div>
            </div>
        );
    }

}