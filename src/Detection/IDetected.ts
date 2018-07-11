import Rect from './Shapes/Rect'

export default interface IDetected {
    class:string,
    probability:number,
    rect:Rect
}