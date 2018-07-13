import Rect from './Shapes/Rect'

export default interface IDetected {
    classID:number,
    probability:number,
    rect:Rect
}