import React, {MouseEvent, PureComponent} from 'react';

interface Props {
  className?: string
  style?: any
  onMouseEnter?: (event: MouseEvent) => void
  onMouseLeave?: (event: MouseEvent) => void
  onMouseDown?: (event: MouseEvent) => void
  onClick?: (event: MouseEvent) => void
  children?: any
};

interface State {
  className: string
  style: undefined | any
};

export default class ToolbarCenter extends PureComponent<Props, State> {
  
  constructor(props: Props) {
    super(props);
    this.state = this.buildStateFromProps(props);
  }

  UNSAFE_componentWillReceiveProps(props: Props) {
    this.setState(this.buildStateFromProps(props));
  }

  buildStateFromProps = (props: Props): State => {
    let className = 'toolbar-center';
    if (props.className) {
      className = `${className} ${props.className}`
    }
    return {
      className: className,
      style: props.style ? props.style : undefined,
    };
  };

  render() {
    return (
      <div
        className={this.state.className}
        style={this.state.style}
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        onMouseDown={this.props.onMouseDown}
        onClick={this.props.onClick}
      >
        {this.props.children}
      </div>
    );
  }
}
