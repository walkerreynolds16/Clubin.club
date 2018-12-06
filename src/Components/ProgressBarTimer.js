import React, { Component } from 'react'
import {Line} from 'rc-progress'
import CC from 'color-convert'
import 'moment-duration-format'


export default class ProgressBarTimer extends Component {
  constructor(props) {
    super(props)

    this.state = {
        timerOn: false,
        waitInterval: 100,
        progressPercentage: 0,
        progressColor: '#000000',
        formattedRemaining: '00:00:00'
    }
  }

  onStartTimer = () => {
    this.setState({
        timerOn: true
    })

    // console.log('onStartTimer()')

    this.onTimeUpdate()
  }

  onStopTimer = () => {
    this.setState({
        timerOn: false,
        progressPercentage: 0
    })

    // console.log('onStopTimer()')
  }

  onTimeUpdate = () => {

    if(this.state.timerOn){
      var duration = this.props.player.getDuration()

      // if video hasn't started, duration will be 0
      if(duration !== 0){
        var currentTime = this.props.player.getCurrentTime()
        var remaining = duration - currentTime
  

        var progressPercentage = 100 - ((remaining/duration) * 100)
        // console.log(progressPercentage)

        var rem = (new Date(remaining * 1000)).toUTCString().match(/(\d\d:\d\d:\d\d)/)
        var formattedRemaining = '00:00'

        if(rem !== null){
          formattedRemaining = rem[0]
        }

        this.setState({
          progressPercentage: progressPercentage,
          formattedRemaining: formattedRemaining
        })

        this.forceUpdate()

        this.changeColorBasedOnPercentage(progressPercentage)
  
      }else{
        console.log('waiting for video to start')
      }

      setTimeout(this.onTimeUpdate, this.state.waitInterval)
    }

    
    
  }

  changeColorBasedOnPercentage = (percent) => {
    var hueNumber = (percent / 100) * 360

    // console.log('Hue Number = ' + hueNumber)
    var hex = CC.hsl.hex(hueNumber, 100, 50)
    // console.log('Hex = ' + hex)

    this.setState({
      progressColor: '#' + hex
    })
  }


  render() {

    return (
      <div style={{'width':'57%', 'position':'absolute', 'left':'20%'}}>
        <Line percent={this.state.progressPercentage} strokeWidth=".5" strokeColor={this.state.progressColor} />
        <span>{this.state.formattedRemaining}</span>
      </div>
    )
  }
}