import * as React from 'react';
import '../Styles/App.css';

interface IFileInputProps {
    title:string;
    onChange:(event:any)=>any;
    enabled:boolean;
}

/*
        <input className="enabledButton" onClick={props.onClick}>{props.title}</button>  
    :
        <button className="disabledButton">{props.title}</button>
*/

export default (props:IFileInputProps) => (
    props.enabled ?
        (<div>
            <label htmlFor="upload" className="EnabledButton">{props.title}</label>
            <input id="upload" type="file" onChange={props.onChange} style={{display:'none'}}/>
        </div>)
    :
        <div>
            <label htmlFor="upload" className="DisabledButton">{props.title}</label>
        </div>
);