import React, {PureComponent} from 'react';

type Props = {
  style?: any;
  children?: any
};

type State = {
  style: undefined | any;
};

export default class ToolbarItem extends PureComponent<Props, State> {
  
  constructor(props: Props) {
    super(props);
    this.state = this.buildStateFromProps(props);
  }

  UNSAFE_componentWillReceiveProps(props: Props) {
    this.setState(this.buildStateFromProps(props));
  }

  buildStateFromProps = (props: Props): State => {
    return {
      style: props.style ? props.style : undefined,
    };
  };

  render() {
    return (
      <div className="toolbar-item" style={this.state.style}>
        {this.props.children}
      </div>
    );
  }
}
