import * as React from "react"

interface IProps {
    title:string,
    enabled:boolean,
    handler:()=>void
    toggle?:boolean,
}

export default function(props:IProps) {
    return <button className={"Button " + (props.enabled ? ((props.toggle===true) ? "Toggled" : "Enabled") : "Disabled")} onClick={props.enabled ? props.handler : null}> {props.title} </button>
}