import * as React from 'react';
import '../Styles/App.css';

interface IDropDownProps {
    title:string;
    itemStrings:string[];
    itemsEnabled:number[];
    enabled:boolean;
    toggle:(i:number)=>void;
}
interface IDropDownState {
    open:boolean;
    itemsEnabled:number[];
}

export default class DropDown extends React.Component<IDropDownProps, IDropDownState> {

  protected elems:string[];
  protected funcs:Array<()=>void>;

  public constructor(props: any) {
      super(props);
      this.funcs = this.props.itemsEnabled.map((e:number,i:number)=>(()=>this.toggle(i)));
      this.elems = this.props.itemStrings.slice(0,10);
      this.state = {
          itemsEnabled: this.props.itemsEnabled,
          open: false
      };
      this.toggleMenu = this.toggleMenu.bind(this);
  }

  public toggle(i:number) {
      // this.setState({open:false});
      this.props.toggle(i);
      this.forceUpdate();
  }

  public componentWillReceiveProps(nextProps) {
      console.log(nextProps)
      this.setState(prevState => ({open: (nextProps.enabled ? prevState.open : false),itemsEnabled:nextProps.itemsEnabled }));
  }

  public toggleMenu() {
      this.setState(prevState => ({open: (this.props.enabled ? (!prevState.open) : false) }));
  }

  public render() {
      return (
        <div className="DropDown">
            <div className="EnabledButton" onClick={this.toggleMenu}>{this.props.title}</div>

            {this.state.open && <ul className="DD-List">
                {this.elems.map( (elem:string,i:number) => (
                    this.state.itemsEnabled[i] ?
                        <li className="DD-Item-Enabled" key={i} onClick={this.funcs[i]}>{elem}</li>
                    :
                        <li className="DD-Item-Disabled" key={i} onClick={this.funcs[i]}>{elem}</li>
                ))}
            </ul>}
        </div>
      );
  }

  protected empty:()=>void = () => {/*Nothing*/};
}

/*
                        <li className="DD-Item-Disabled" key={i} onClick={this.empty}>{elem}</li>
        <div className="DropDown">
            <div className="DD-Menu" onClick={this.toggleMenu}>{this.props.title}</div>

            {this.state.open && <ul className="DD-List">
                {this.elems.map( (elem:string,i:number) => (
                    this.props.itemsEnabled[i] ?
                        <li className="enabledDropDownItem" key={i} onClick={this.funcs[i]}>{elem}</li>
                    :
                        <li className="disabledDropDownItem" key={i} onClick={this.empty}>{elem}</li>
                ))}
            </ul>}
        </div>
*/