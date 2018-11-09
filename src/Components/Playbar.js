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
  marginTop: '5px',
  marginLeft: '25px',
  display: 'flex',
  alignItems: 'center'
}

export default class Playbar extends Component {
  constructor(props) {
    super(props)

    this.state = {
      volume: 10,
      isMuted: undefined
    }
  }

  componentDidMount() {    
    // this.waitForVolume()
    // this.waitForIsMuted()
  }

  waitForVolume = () => {
    console.log('calling volume')
    var vol = this.props.getPlayerVolume()

    if(vol === undefined){
      setTimeout(this.waitForVolume, 100)
    }else {
      this.setState({
        volume: vol
      })

      this.forceUpdate()
    }

  }

  waitForIsMuted = () => {
    var mute = this.props.getPlayerIsMuted()

    if(mute === undefined){
      setTimeout(this.waitForIsMuted, 100)
    }else {
      this.setState({
        isMuted: mute
      })

      this.forceUpdate()
    }
  }

  onSliderChange = (value) => {
    this.props.onSliderChange(value)

    this.setState({
      volume: value
    })

    this.forceUpdate()
  }

  onMute = () => {
    this.props.onToggleMutePlayer()

    // if(this.state.isMuted){
    //   this.setState({
    //     volume: this.props.getPlayerVolume()
    //   })
    // }

    this.setState({
      isMuted: !this.state.isMuted
    })
  }

  render() {

    return (
      <div style={mainStyle}>
          <div style={volumeSliderStyle}>
            {/* <img style={{'cursor':'pointer'}} width="25" height="25" src="https://img.icons8.com/ios/50/000000/high-volume-filled.png" onClick={this.onMute}/> */}

            <svg width="50" height="50" viewBox="0 0 640 640" style={{'cursor':'pointer'}} onClick={this.onMute}>
                           
              <path 
                d="M158.02 203.29L42.64 203.29L42.64 338.98L156.27 338.98L279.92 445.94L279.92 97.85L279.92 97.85L158.02 203.29Z" 
                id="speaker"
                style={{'fill':'#111111', 'stroke':'#111111', 'strokeWidth':'5', 'strokeLinejoin':'round'}}/>

              
              {this.state.isMuted &&
                <path 
                  d="M46.94 89.77L73.18 68.52L388.91 458.4L362.66 479.66L46.94 89.77Z" 
                  id="blackStripe"
                  style={{'fill':'#111111', 'strokeWidth': '50'}}/>
              }

              {this.state.isMuted &&
                <path 
                  d="M71.24 68.18L97.49 46.93L413.21 436.82L386.97 458.07L71.24 68.18Z" 
                  id="whiteStripe"
                  style={{'fill':'#ffffff', 'strokeWidth': '50'}}/>
              }
              
              {this.state.volume > 0 &&
                <path 
                  d="M342.03 348.44C355.74 326.44 363.79 300.55 363.79 272.73C363.79 244.46 355.52 218.2 341.43 195.98" 
                  id="litteVolume"
                  style={{'fill':'none', 'stroke':'#111111', 'strokeWidth':'25', 'strokeLinecap':'round'}}/>
              }

              {this.state.volume >= 33 &&
                <path 
                  d="M391.45 145.95C417.71 181.38 433.27 225.24 433.27 272.73C433.27 319.79 417.98 363.26 392.13 398.51" 
                  id="midVolume"
                  style={{'fill':'none', 'stroke':'#111111', 'strokeWidth':'25', 'strokeLinecap':'round'}}/>
              }

              {this.state.volume >= 66 &&
                <path 
                  d="M438.55 444.96C475.98 397.58 498.38 337.79 498.38 272.74C498.38 207.24 475.69 147.08 437.83 99.56" 
                  id="bigVolume"
                  style={{'fill':'none', 'stroke':'#111111', 'strokeWidth':'25', 'strokeLinecap':'round'}}/>
              }              

            </svg>

            {this.state.volume !== undefined &&
              <Slider style={{'marginLeft':'5px'}} min={0} max={100} handle={handle} onChange={this.onSliderChange} defaultValue={this.state.volume}/>
            }
          </div>
      </div>
    )
  }
}