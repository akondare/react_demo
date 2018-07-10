import * as React from 'react';
import './App.css';

interface IControl {
    onDet:(event:any)=>any;
    onFle:(event:any)=>any;
    onObj:(event:any)=>any;
    onTrn:(event:any)=>any;
    isLoaded:boolean;
    isDetecting:boolean;
    isTraining:boolean;
    cats:string[];
}

class Control extends React.Component<IControl, {}> {

  protected img:HTMLImageElement = new Image();

  public constructor(props: any) {
      super(props);
  }


  /*
  public onImageUpload = (event:any) => {
    const url:string = URL.createObjectURL(file);
    this.props.changeOptions(url,"file");
  }
  public onClickDetect = (event:any) => {
    this.setState({ isDetecting: true });
  }
  public onClickTrain = (event:any) => {
    this.setState({ isTraining: true });
  }
  */

  /*
            <select autoFocus={false} multiple={true}>
            <label htmlFor="file">Choose a file</label>
                <option value={0}>Cat</option>
                <option value={1}>Dog</option>
                <option value={2}>Bird</option>
  */
  public render() {
    return (
      <div className="Control" style={{display:"flex"}}>
        <div className="file" style={{width:"35em"}}>
            <input className={"ImageInput"} type={"file"} id={"file"} onChange={this.props.onFle}/>
        </div>
        <div className="detect" style={{width:"35em"}}>
            <p>
            Type: {     }
            <select name="Type">
                {this.props.cats.map((c)=><option key={c}>{c}</option>)}
            </select> {     }
            <button onClick={this.props.onDet}>Detect</button>
            </p>
        </div>
        <div className="train" style={{width:"35em"}}>
            <span>Select Boxes</span>
            <button onClick={this.props.onTrn}>Train</button>
        </div>
      </div>
    );
  }
}

export default Control;