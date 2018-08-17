import * as React from "react"

interface IProps {
    title:string,
    enabled:boolean,
    handler:()=>void
}

export default function(props:IProps) {
    return  <div className="FileInput">
        <input style={{display:'none'}} type="file" name="file" id="file" className="inputFile" onChange={props.enabled?props.handler:undefined}/>
        <label className={"Button " + (props.enabled ? "Enabled" : "Disabled")} htmlFor={props.enabled?"file":undefined} > {props.title} </label>
    </div>
}