import React, { Component } from 'react'
import Sound from 'react-sound'
import notificationList from '../Components/NotificationList'

export default class Notification extends Component {
  constructor(props) {
    super(props)
    
    this.state = {
      playStatus: Sound.status.STOPPED,
      volume: this.props.volume,
      isMuted: this.props.isMuted,
      position: 0,
      currentNotification: notificationList[this.props.notificationListIndex]
    }
  }

  componentWillReceiveProps() {
    // console.log("Receiving props ****")
    // console.log(this.state.isMuted)
    // console.log(this.state.volume)
    // this.setState({
    //   volume: this.props.volume,
    //   isMuted: this.props.isMuted,
    //   currentNotification: notificationList[this.props.notificationListIndex]
    // })
  }

  onSettingsChangeVolume = (value) => {
    this.setState({
      playStatus: Sound.status.STOPPED,
      volume: value
    })
  }

  onSettingsChangeMuted = (value) => {
    this.setState({
      playStatus: Sound.status.STOPPED,
      isMuted: value
    })
  }
  onSettingsChangeCurrentNotification = (value) => {
    this.setState({
      playStatus: Sound.status.STOPPED,
      currentNotification: notificationList[value]
    })
  }


  startNotification = () => {
    console.log("start notification ****")
    console.log(this.state.isMuted)
    console.log(this.state.volume)
    this.setState({
      playStatus: Sound.status.PLAYING
    })
  }

  onPlayerStop = () => {
    this.setState({
      playStatus: Sound.status.STOPPED,
      position: 0
    })
  }


  render() {
    
    return (
      <div>
        {this.state.isMuted &&
          <Sound
            url={this.state.currentNotification.url}
            playStatus={this.state.playStatus}
            volume={0}
            position={this.state.position}
            onFinishedPlaying={this.onPlayerStop}
          />
        }

        {!this.state.isMuted &&
          <Sound
            url={this.state.currentNotification.url}
            playStatus={this.state.playStatus}
            volume={this.state.volume}
            position={this.state.position}
            onFinishedPlaying={this.onPlayerStop}
          />
        }
      </div>
    )
  }
}