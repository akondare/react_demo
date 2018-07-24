import * as React from "react"
import Classes from "./Classes"
import DrawToCanvas from "./Utils/DrawToCanvas"
import {IObject} from "./Utils/Object"
import {Rect} from "./Utils/Rect"

interface IProps {
    // imgElem:HTMLImageElement
    key:number,
    url:string
}

interface IState {
    key:number,
    zone:Rect;
}

export default class DetView extends React.Component<IProps,IState>{

    protected imageCanvas:HTMLCanvasElement;
    protected image:HTMLImageElement;
    protected colors:string[];

    protected max:number = 500;

    constructor(props:IProps) {
        super(props);
        this.colors = Classes.map(_ => (
            "rgb(" + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + ")"
        ));
        this.image.addEventListener('load', this.drawImage);
    }

    public getDerivedStateFromProps(props:IProps,state:IState) {
        if( props.key !== state.key) {
            this.image.url = props.url;
            this.setState({
                key:props.key,
            });
        }
    }
    
    public drawImage() {
        DrawToCanvas.clearCanvas(this.imageCanvas);
        const ctx:CanvasRenderingContext2D = this.imageCanvas.getContext('2d');

        ti
        const ratio:number = this.imag

        ctx.drawImage(image,0,0,width,height);
    }

    public render() {
        return  <div className="DetView">
                    <canvas className="ImageView" ref={ref=>this.imageCanvas=ref}/>
                </div>
    }
}