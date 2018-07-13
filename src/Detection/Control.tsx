import * as React from 'react';
import '../Styles/App.css';
import Button from "./Button";
import DropDown from "./DropDown";
import FileInput from "./FileInput";

interface IControl {
    // state 
    canOpenFile:boolean;
    canChangeCats:boolean;
    canDetect:boolean;
    canTrain:boolean;

    // state changing handlers
    onDet:()=>any;
    onFle:(event:any)=>any;
    onTrn:()=>any;

    // dropdown 
    cats:string[];
    catInds:number[];
    toggleCat:(i:number)=>any;
}

export default (props:IControl) => (
  <div className="Control">
    <FileInput title="Open File" onChange={props.onFle} enabled={props.canOpenFile}/>

    <DropDown title="Types" itemStrings={props.cats} itemsEnabled={props.catInds} toggle={props.toggleCat} enabled={props.canChangeCats}/>

    <Button title="Detect" onClick={props.onDet} enabled={props.canDetect} />

    <Button title="Retrain" onClick={props.onTrn} enabled={props.canTrain} />
  </div>
);

// export default Control;