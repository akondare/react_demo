import * as React from "react"
import Classes from "./Classes"
import DrawToCanvas from "./Utils/DrawToCanvas"
import {IObject} from "./Utils/Object"
import {Rect} from "./Utils/Rect"

interface IProps {
    image:HTMLImageElement;
    w:number;
    h:number;

    predBoxes:IObject[][];
    chosenZone:Rect;

    drawnBoxes:IObject[][];

    // are input features enabled
    canAdd:boolean;
    canRem:boolean;

    // update drawn boxes
    addBox:(b:Rect)=>void;
    remBox:(i:number)=>void;

    canUpdateImage:boolean;
    canUpdateDetection:boolean;
    canUpdateUser:boolean;
    canAddUser:boolean;
    canRemUser:boolean;
}

interface IState {
    w:number;
    h:number;
    zone:Rect;
}

export default class DetView extends React.Component<IProps,IState>{

    protected imageCanvas:HTMLCanvasElement;
    protected predCanvas:HTMLCanvasElement;
    protected userCanvas:HTMLCanvasElement;
    protected colors:string[];

    constructor(props:IProps) {
        super(props);
        this.setState({zone:props.chosenZone,w:props.w,h:props.h});
        this.colors = Classes.map(_ => (
            "rgb(" + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + ")"
        ));
    }

    public drawImage(image:HTMLImageElement, w:number, h:number) {
        DrawToCanvas.clearCanvas(this.imageCanvas);
        const ctx:CanvasRenderingContext2D = this.imageCanvas.getContext('2d');
        ctx.drawImage(image,0,0,w,h);
    }
    public drawPreds(zone:Rect, boxes:IObject[][]) {
        DrawToCanvas.clearCanvas(this.predCanvas);
        DrawToCanvas.drawRect(this.predCanvas,zone,"#fff",3);
        boxes.forEach((bs,i) => {
            const color:string = this.colors[i]; 
            bs.forEach(b=> {
                DrawToCanvas.drawPredictionRect(this.predCanvas,b,2,color,12);
            })
        })
    }
    public drawUser(boxes:IObject[][]) {
        DrawToCanvas.clearCanvas(this.userCanvas);
        boxes.forEach((bs,i) => {
            const color:string = this.colors[i]; 
            bs.forEach(b=> {
                DrawToCanvas.drawPredictionRect(this.userCanvas,b,2,color,12);
            })
        })
    }

    public componentWillReceiveProps(nextProps:IProps) {
        if( nextProps.canUpdateImage ) {
            this.drawImage(nextProps.image,nextProps.w,nextProps.h);
            this.setState({w:nextProps.w,h:nextProps.h});
        }
        if( nextProps.canUpdateDetection && this.state.zone !== nextProps.chosenZone) {
            this.drawPreds(nextProps.chosenZone,nextProps.predBoxes);
            this.setState({zone:nextProps.chosenZone});
        }
        else if( nextProps.canAddUser ) {
            this.drawUser(nextProps.drawnBoxes);
        }
    }

    public render() {
        return  <div className="DetView">
                    <canvas className="ImageView" ref={ref=>this.imageCanvas=ref}/>
                    <canvas className="PredView" ref={ref=>this.imageCanvas=ref}/>
                    <canvas className="UserView" ref={ref=>this.imageCanvas=ref}/>
                </div>
    }
}