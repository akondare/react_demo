import * as React from 'react';
import './App.css';
import Detection from './Detection';

export default function () {
  return (
    <div className='App'>
      <Detection />
    </div>
  );
};
// import DropdownMenu,{DropdownMenuProps} from '@cgsweb/core/components/DropdownMenu/DropdownMenu'
  /*
  const props:DropdownMenuProps = {
    id: "string",
    openOnHover: true,
    title: <button/>,
  } 
  */
      // <DropdownMenu {...props}><li>pizza</li><li>tomatoes</li></DropdownMenu>