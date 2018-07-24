import * as React from "react"

interface IProps {
    title:string,
    enabled:boolean,
    handler:()=>void
}

export default function(props:IProps) {
    console.log(props.enabled);
    return  <div className="FileInput">
        <input style={{display:'none'}} type="file" name="file" id="file" className="inputFile" onChange={props.enabled?props.handler:null}/>
        <label className={props.enabled ? "enabledButton" : "disabledButton"} htmlFor={props.enabled?"file":null} > {props.title} </label>
    </div>
}