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
    this.setState({
      volume: this.props.volume,
      isMuted: this.props.isMuted,
      currentNotification: notificationList[this.props.notificationListIndex]
    })
  }


  startNotification = () => {
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
    console.log(this.state.volume)
    console.log(this.state.isMuted)

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