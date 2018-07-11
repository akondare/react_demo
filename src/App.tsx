import * as React from 'react';
import './App.css';
import DetectionContainer from './Detection/DetectionContainer'

const App = () => {
  const appStyle:React.CSSProperties = {
    height: "100%",
    width:  "100%"
  };

  return(
    <DetectionContainer style={appStyle} />
  )
}

export default App;
