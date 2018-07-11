import * as React from 'react';

const ImageView = (props) => {
  return(
    <div style={props.style}>
      {props.imgCan}
      {props.predCan}
    </div>
  )
}

export default ImageView;