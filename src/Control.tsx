import * as React from 'react';
import './App.css';

class Control extends React.Component {

  protected img:HTMLImageElement = new Image();

  public constructor(props: any) {
      super(props);
      this.state = { isEmpty: true, isLoaded: false, isDetecting: false, isTraining: false };
  }


  public onImageUpload = (event:any) => {
      const file:File = event.target.files[0];

      if(file) {
          const url:string = URL.createObjectURL(file);
          this.setState({ isFileLoaded: true });
          this.img.src = url;
      }
  }
  public onClickDetect = (event:any) => {
    this.setState({ isDetecting: true });
  }
  public onClickTrain = (event:any) => {
    this.setState({ isTraining: true });
  }

  /*
            <select autoFocus={false} multiple={true}>
            <label htmlFor="file">Choose a file</label>
  */
  public render() {
    return (
      <div className="Control" style={{display:"flex"}}>
        <div className="file" style={{width:"35em"}}>
            <input className={"ImageInput"} type={"file"} id={"file"} onChange={this.onImageUpload}/>
        </div>
        <div className="detect" style={{width:"35em"}}>
            <p>
            Type: {     }
            <select name="Type">
                <option value={0}>Cat</option>
                <option value={1}>Dog</option>
                <option value={2}>Bird</option>
            </select> {     }
            <button onClick={this.onClickDetect}>Detect</button>
            </p>
        </div>
        <div className="train" style={{width:"35em"}}>
            <span>Select Boxes</span>
            <button onClick={this.onClickTrain}>Train</button>
        </div>
      </div>
    );
  }
}

export default Control;