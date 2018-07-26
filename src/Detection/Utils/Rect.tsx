import {IPoint,Point} from "./Point"

export interface IRect {
    x:number;
    y:number;
    h:number;
    w:number;
}

export class Rect implements IRect {
    
    public x:number;
    public y:number;
    public w:number;
    public h:number;

    constructor(x:number, y:number, width:number, height:number) {
        this.x = x;
        this.y = y;
        this.w = width;
        this.h = height;
    }

    public getDetails() {
        return [this.x,this.y,this.w,this.h]
    }

    public getCenterPoint():Point {
        const centerX:number = this.x + this.w/2;
        const centerY:number = this.y + this.h/2;
        return(new Point(centerX, centerY));
    }

    public translateByVector(vector:IPoint) {
        this.x = this.x + vector.x;
        this.y = this.y + vector.y;
        return this;
    }

    public inflate(vector:IPoint) {
        this.x = this.x - vector.x;
        this.y = this.y - vector.y;
        this.w = this.w + 2*vector.x;
        this.h = this.h + 2*vector.y;
        return this;
    }

    public toString() {
        return("{x: " + this.x + ", y: " + this.y + ", width: " + this.w + ", height: " + this.h + "}");
    }
}