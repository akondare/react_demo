import * as React from "react"
import Button from "./Options/Button"
import DropDown from "./Options/DropDown"
import FileInput from "./Options/FileInput"

interface IProps {
    optionsEnabled:boolean[],
    optionHandlers:Array<()=>any>
    classStrings:string[],
    classesEnabled:boolean[]
}

export default function(props:IProps){
    return  ( 
        <div className="Control">
            <FileInput title="Open File" enabled={props.optionsEnabled[0]} handler={props.optionHandlers[0]} />
            <DropDown title="Classes" enabled={props.optionsEnabled[1]} handler={props.optionHandlers[1]} elemStrings={props.classStrings} elemsEnabled={props.classesEnabled} />
            <Button title="Select Region" enabled={props.optionsEnabled[2]} handler={props.optionHandlers[2]} toggle={props.optionsEnabled[3]}/>
            <Button title="Detect" enabled={props.optionsEnabled[4]} handler={props.optionHandlers[3]}/>
        </div> 
    );
};