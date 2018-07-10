import * as React from 'react';
import './App.css';
import Control from './Control';
import ImageSpace from './ImageSpace';
import categories from "./Objects.js";

interface IState {
  isLoaded:boolean;
  isLoading:boolean;
  isDetected:boolean;
  isDetecting:boolean;
  isTraining:boolean;
}

class App extends React.Component<{}, IState > {

  protected img:HTMLImageElement = new Image();

  public constructor(props: any) {
      super(props);
      this.state = { isLoaded: false, isLoading:false, isDetected:false,isDetecting: false, isTraining: false };
  }

  public onFileChange = (event:any) => {
    this.setState({isLoading:true});
    this.img.src = URL.createObjectURL(event.target.files[0]);
    /*
    const url = URL.createObjectURL(event.target.files[0]);;
    this.setState({isLoaded:true, imgSrc:url});
    */
  }

  public onObjChange = (event:any) => {
    /*TODO*/
  }

  public onDetectChange = (event:any) => {
    if( this.state.isLoaded ) {
      this.setState({isDetecting:true})
    }
  }

  public onTrainChange = (event:any) => {
    if( this.state.isLoaded ) {
      this.setState({isTraining:true})
    }
  }

  public onImgRender = () => {
    this.setState({isLoading:false, isLoaded:true})
  }
  public onPredRender = () => {
    this.setState({isDetecting:false, isDetected:true})
  }

  public render() {
    const changeOptions = {
      onDet  : this.onDetectChange.bind(this),
      onFle : this.onFileChange.bind(this),
      onObj  : this.onObjChange.bind(this),
      onTrn  : this.onTrainChange.bind(this)
    };

    const currState = this.state; 

    const changeProcess = {
      onImgRender : this.onImgRender.bind(this),
      onPredRender : this.onPredRender.bind(this)
    }

    return (
      <div className='App'>
        <header className="App-header">
          <h1 className="App-title">Object Detector</h1>
          <Control {...changeOptions} {...currState} cats={categories}/>
        </header>
        <ImageSpace {...currState} img={this.img} {...changeProcess} />
      </div>
    );
  }
}

export default App;
