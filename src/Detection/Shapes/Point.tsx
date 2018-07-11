import { IPoint } from './Shapes';

export default class Point implements IPoint {
    public x:number;
    public y:number;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}