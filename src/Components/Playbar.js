import React, { Component } from 'react'
import App from './App'
import Login from './Login'
import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";
import Slider from 'rc-slider'
import Tooltip from 'rc-tooltip'

import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Handle = Slider.Handle;

const handle = (props) => {
  const { value, dragging, index, ...restProps } = props;
  return (
    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={value}
      visible={dragging}
      placement="top"
      key={index}
    >
      <Handle value={value} {...restProps} />
    </Tooltip>
  );
};

const mainStyle = {
  width: '70%',
  height: '60px',
  borderStyle: 'solid',
  borderWidth: '5px',
  position: 'fixed',
  bottom: '0px'
}

const volumeSliderStyle = {
  width: '15%',
  marginTop: '20px',
  marginLeft: '25px'
}

export default class Playbar extends Component {
  constructor(props) {
    super(props)

    this.state = {

    }
  }

  onSliderChange = (value) => {
    this.props.onSliderChange(value)
  }

  render() {

    return (
      <div style={mainStyle}>
          <div style={volumeSliderStyle}>
            <Slider min={0} max={100} defaultValue={100} handle={handle} onChange={this.onSliderChange}/>
          </div>
      </div>
    )
  }
}