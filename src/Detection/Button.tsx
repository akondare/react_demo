import * as React from 'react';
import '../Styles/App.css';

interface IButtonProps {
    title:string;
    onClick:()=>any;
    enabled:boolean;
}

export default (props:IButtonProps) => (
    <div>{
    props.enabled ? 
        <button className="EnabledButton" onClick={props.onClick}>{props.title}</button>  
    :
        <button className="DisabledButton">{props.title}</button>
    }</div>
);