import * as React from "react"

interface IProps {
    title:string,
    enabled:boolean,
    handler:()=>void
}

export default function(props:IProps) {
    return <button className={props.enabled ? "enabledButton" : "disabledButton"} onClick={props.enabled ? props.handler : null}> {props.title} </button>
}