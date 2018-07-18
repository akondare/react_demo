import * as React from "react"
import Button from "./Options/Button"
import DropDown from "./Options/DropDown"
import FileInput from "./Options/FileInput"

interface IProps {
    canOpenFile: boolean;
    canChangeClasses: boolean;
    canDetect: boolean;
    canCorrect: boolean;
    canMark: boolean;
    canAdd: boolean;
    canRem: boolean;
}
export default (props:IProps) => {
    return  <div className="Control">
                <FileInput title="Open File" enabled={props.canOpenFile}/>
                <DropDown title="Classes" enabled={props.canChangeClasses}/>
                <Button title="Detect" enabled={props.canDetect}/>
                <Button title="Correct" enabled={props.canCorrect}/>
                <Button title="Mark Incorrect" enabled={props.canMark}/>
                <Button title="Add New" enabled={props.canAdd}/>
                <Button title="Remove New" enabled={props.canRem}/>
            </div>
};