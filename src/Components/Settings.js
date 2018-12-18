import React, { Component } from 'react'
import { Button, ListGroup, ListGroupItem, Modal, Dropdown, MenuItem, Glyphicon, DropdownButton } from 'react-bootstrap';
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import notificationList from '../Components/NotificationList'

import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';


const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;

const handle = (props) => {
  const { value, dragging, index, ...restProps } = props;
  return (
    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={value}
      visible={dragging}
      placement="top"
      key={index}>

      <Handle value={value} {...restProps} />
    </Tooltip>
  );
};

const volumeSliderStyle = {
  width: '30%',
  marginTop: '5px',
  marginLeft: '25px',
  display: 'flex',
  alignItems: 'center'
}


export default class Settings extends Component {
  constructor(props) {
    super(props)
    
    this.state = {
      volume: this.props.notificationVolume,
      isMuted: this.props.notificationMuted,
      currentNotificationSound: notificationList[this.props.notificationListIndex]
    }
  }

  onNotificationMuted = () => {
    this.props.notificationMutedChange(!this.state.isMuted)

    this.setState({
      isMuted: !this.state.isMuted
    })

    this.forceUpdate()
  }

  onNotificationVolumeChange = (value) => {
    this.props.notificationVolumeChange(value)

    this.setState({
      volume: value
    })

    this.forceUpdate()
  }

  setNotificationSound = (obj, index) => {
    if(obj === this.state.currentNotificationSound){
      alert("You picked your current notification noise, you dingus.")
    }else{
      this.props.notificationListIndexChange(index)

      this.setState({
        currentNotificationSound: notificationList[index]
      })
    }
  }


  render() {

    return (
      <div>
        <Modal show={true} bsSize='large' onHide={() => this.props.showSettings(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Settings</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              <form>
                <fieldset>
                  <legend>Change Notification Volume</legend>

                  <div style={volumeSliderStyle}>

                    <svg width="50" height="50" viewBox="0 0 640 640" style={{'cursor':'pointer'}} onClick={this.onNotificationMuted}>
                                    
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

                    <Slider style={{'marginLeft':'5px'}} min={0} max={100} handle={handle} onChange={this.onNotificationVolumeChange} defaultValue={this.state.volume}/>

                    <span style={{"marginLeft":'10px'}}>{this.state.volume}</span>
                  </div>
                </fieldset>
              </form>

              <form>
                <fieldset>
                  <legend>Change Notification Noise</legend>

                  <DropdownButton
                    bsStyle='Default'
                    title={this.state.currentNotificationSound.title}
                    id={`dropdown`}>

                    {notificationList.map((obj, index) => {
                      return (
                        <MenuItem key={index} onSelect={() => this.setNotificationSound(obj, index)}>{obj.title}</MenuItem>
                      )

                    })}

                  </DropdownButton>
                  

                  
                  
                </fieldset>
              </form>
              

              
            </div>
          </Modal.Body>

        </Modal>
      </div>
    )
  }
}