import React, { Component } from 'react'
import App from './App'
import Login from './Login'
import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";
import Slider from 'react-bootstrap-slider'

const mainStyle = {
  width: '100%'
}

const volumeSliderStyle = {
  width: '30%'
}

export default class Playbar extends Component {
  constructor(props) {
    super(props)

    this.state = {
      volumeSlider: 100,

    }
  }

  updateVolumeSlider = (val) => {
    this.setState({
      volumeSlider: val
    })
  }


  render() {

    return (
      <div style={mainStyle}>
          <div>
            <Slider 
              min={0}
              max={100}
              value={this.state.volumeSlider}
              change={this.updateVolumeSlider}/>
          </div>

          <h1>Playbar</h1>
      </div>
    )
  }
}