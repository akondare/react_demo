import {IObject} from "./Object";
import {IPoint} from "./Point";
import {IRect} from "./Rect";

export default class DrawToCanvas {
    public static setSize(canvas:HTMLCanvasElement, w:number,h:number) {
        canvas.width = w;
        canvas.height = h;
    }

    public static clearCanvas(canvas:HTMLCanvasElement): void {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }

    public static drawRect(canvas:HTMLCanvasElement, rect:IRect, color:string = "#fff", thickness:number = 1): void {
        // preserve context 
        const ctx:CanvasRenderingContext2D = canvas.getContext('2d');
        ctx.save();

        // set parameters
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;

        // draw rectangle and restore context
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.stroke();
        ctx.restore();
    }

    public static drawText(canvas:HTMLCanvasElement, text:string, textSize:number, anchorPoint:IPoint, color:string = "#ffffff", bold:boolean = false):void {
        // preserve context
        const ctx:CanvasRenderingContext2D = canvas.getContext('2d');
        ctx.save();

        // set parameters
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline="middle"; 
        ctx.font = (bold ? "bold " : "") + textSize + "px Titillium Web";

        // draw text and restore context
        ctx.fillText(text, anchorPoint.x, anchorPoint.y); 
        ctx.restore();
    }

    public static drawPredictionRect(canvas:HTMLCanvasElement, prediction:IObject, thickness:number = 1, color:string = "#fff", textSize:number = 10): void {
        DrawToCanvas.drawRect(canvas, prediction.rect, color, thickness);

        const ctx:CanvasRenderingContext2D = canvas.getContext('2d');
        ctx.save();

        ctx.font = "bold " + textSize + "px Titillium Web";
        const txt = prediction.class + " " + prediction.probability.toFixed(2);
        const padding = 2;
        const width = ctx.measureText(txt).width; 
        ctx.fillStyle = color;
        ctx.textAlign = "start";
        ctx.textBaseline = "top";

        ctx.fillRect(prediction.rect.x, prediction.rect.y, width + padding * 2, textSize + padding * 2);
        ctx.fillStyle = "#fff";
        ctx.fillText(txt, prediction.rect.x + padding, prediction.rect.y);

        ctx.restore();
    }
}