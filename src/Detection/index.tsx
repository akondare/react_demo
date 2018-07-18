import * as React from "react";
import Classes from "./Classes"

import Control from "./Control"
import DetView from "./Control"

export default class Detection extends React.Component<{},{}>{

    // class related structures
    protected classes:string[];
    protected enabled:boolean[];
    
    constructor() {
        super({});
        this.classes = Classes;
        this.enabled = Classes.map(e => true); 
    }

    public render() {
        const controlProps = {};
        const detViewProps = {};
        return (
            <div className="Detection">
                <Control {...controlProps} />
                <DetView {...detViewProps} />
            </div>
        );
    }

}