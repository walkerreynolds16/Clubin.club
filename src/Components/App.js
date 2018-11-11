import React, { Component } from 'react';
import Login from '../Components/Login'
import Playbar from '../Components/Playbar';
import YouTube from 'react-youtube';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { Button, ListGroup, ListGroupItem, Modal, Tooltip, OverlayTrigger, Tab, Tabs } from 'react-bootstrap';
import Slider from 'react-slide-out'
import Axios from 'axios'
import '../Styles/App.css';
import 'react-slide-out/lib/index.css'
import Moment from 'moment'
import 'moment-duration-format'

import openSocket from 'socket.io-client';



//API Link
//https://plug-dj-clone-api.herokuapp.com

const apiEndpoint = 'http://127.0.0.1:5000'
// const apiEndpoint = 'https://plug-dj-clone-api.herokuapp.com'

const socket = openSocket.connect(apiEndpoint, {transports: ['websocket']})


var video = ''
const youtubeAPIKey = 'AIzaSyD7edp0KrX7oft2f-zL2uEnQFhW4Uj5OvE'

const currentPlaylistStyle = {
  display: 'inline-block',
  position: 'fixed',
  width: '21%',
  top: '0px',
  right: '0px',
  background: '#9699a0',
  border: '2px double #74757E'
}

const listStyle = {
  display: 'inline-block',
  position: 'fixed',
  width: '21%',
  top: '60px',
  right: '0px',
  background: '#9699a0',
  border: '2px double #74757E'
}

const playerStyle = {
  display: 'inline',
  position: 'relative',
  left: '0',
  top: '0px'
}

const tabStyle = {
  position: 'fixed',
  height:'35%',
  width: '21%',
  right: '0px',
  bottom: '0px',
  backgroundColor: '#fff'
  
}

const chatWindowStyle = {
  width: '100%',
  overflow: 'auto',
  background: '#9699a0',
  borderLeft: '2px double #74757E',
  borderRight: '2px double #74757E',
}

const messagesStyle = {
  position: 'relative',
  height:'100%',
  width: '100%',
  overflow: 'auto',
  background: '#9699a0',
  border: '2px double #74757E'

}

const SortableItem = SortableElement(({ value, onClickDeleteCallback, listIndex }) => {
  var image = 'https://img.youtube.com/vi/' + value.videoId + '/0.jpg'

  return (
    <div style={{ 'marginTop': '8px', 'marginBottom': '8px', 'position': 'relative' }}>
      <li style={{ 'display': 'flex', 'alignItems': 'center' }}>
        <img src={image} style={{ 'width': '80px', 'height': '55px' }} />
        <h6 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px' }}>{value.videoTitle}</h6>

        <Button
          style={{ 'display': 'inline-block', 'position': 'absolute', 'right': '5px' }}
          onClick={() => onClickDeleteCallback(listIndex)}>

          <svg width="11" height="11" viewBox="0 0 1024 1024">
            <path d="M192 1024h640l64-704h-768zM640 128v-128h-256v128h-320v192l64-64h768l64 64v-192h-320zM576 128h-128v-64h128v64z"></path>
          </svg>

        </Button>
      </li>
    </div>

  );
});

const SortableList = SortableContainer(({ items, onClickDeleteCallback }) => {
  return (
    <div style={{ 'overflow': 'auto', 'height': '420px' }}>
      <ul>
        {items.map((value, index) => (

          <SortableItem key={`item-${index}`} index={index} value={value} onClickDeleteCallback={onClickDeleteCallback} listIndex={index} />
        ))}
      </ul>
    </div>

  );
});

const disabledAddVideoButtonTooltip = (
  <Tooltip id="tooltip">
    Create a playlist in the playlist menu before adding videos.
  </Tooltip>
);


class App extends Component {

  constructor(props) {
    super(props)

    this.state = {
      currentPlaylist: { playlistTitle: '', playlistVideos: [] },
      showAddVideoModal: false,
      addVideoSearchTerm: '',
      playerWidth: '',
      playerHeight: '',
      searchList: [],
      currentUser: this.props.loginUsername,
      showPlaylistSlideIn: false,
      playlists: [
        { playlistTitle: '', playlistVideos: [] }
      ],
      showAddPlaylistModal: false,
      newPlaylistNameInput: '',
      chatMessages: [],
      userPlayingVideo: '',
      currentVideoTitle: '',
      messageBoxValue: '',
      isUserDJing: false,
      testSetUsername: '',
      startTime: 0,
      player: null,
      disableAddVideoButton: false,
      clients: [],
      DJQueue: [],
      tabKey: 1

    }
  }

  componentDidMount() {
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions);

    window.addEventListener("beforeunload", (ev) => this.handleWindowClose(ev));

    this.getPlaylistsForCurrentUser()

    socket.on('Event_userConnecting', (data) => this.handleUserConnecting(data))

    socket.on('message', (msg) => this.handleMessage(msg))

    socket.on('Event_receiveChatMessage', (data) => this.handleReceiveChatMessage(data))

    socket.on('Event_nextVideo', (data) => this.handleNextVideo(data))

    socket.on('Event_stopVideo', () => this.handleStopVideo())

    socket.on('Event_DJQueueChanging', (DJs) => this.handleDJQueueChange(DJs))
    
    socket.on('Event_userDisconnecting', (data) => this.handleUserDisconnecting(data))

    this.handleConnect()

  }

  handleDJQueueChange = (DJs) => {
    // console.log('User joining dj queue')
    // console.log(DJs)

    this.setState({
      DJQueue: DJs
    })
  }


  handleUserDisconnecting = (data) => {
    // console.log(data.user + " is disconnecting")

    // console.log(data.clients)

    this.setState({
      clients: data.clients
    })
  }

  handleUserConnecting = (data) => {
    // console.log(data.user + " is connecting")

    // console.log(data.clients)

    this.setState({
      clients: data.clients
    })

  }

  handleWindowClose = (ev) => {
    ev.preventDefault();

    socket.emit('Event_userDisconnected', this.state.currentUser)
  }

  handleStopVideo = () => {
    if(this.state.player != null){
      // console.log('Stopping Video')

      this.state.player.stopVideo()
      video = ''
      this.forceUpdate()
    }

    this.setState({
      userPlayingVideo: '',
      currentVideoTitle: ''
    })
    
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  handleConnect = () => {
    socket.emit('Event_userConnected', this.state.currentUser)

    this.getCurrentVideo()

    //Send message to everyone saying that a user has connected
    socket.emit('Event_sendChatMessage',
      {
        user: 'Server',
        message: this.state.currentUser + ' has connected'
      }
    )
  }

  getCurrentVideo = () => {
    //If a user connects, check if anyone is DJing, if so, get time tag and display video
    var url = apiEndpoint + '/getCurrentVideo'
    Axios.get(url)
      .then((response) => {
        // console.log(response)

        if (response['data'] !== 'No one playing') {
          video = response['data']['videoId']
          this.setState({
            startTime: parseInt(response['data']['startTime'], 10),
            userPlayingVideo: response['data']['currentDJ'],
            currentVideoTitle: response['data']['currentVideoTitle']
          })

          this.forceUpdate()
        }

      })
  }

  handleMessage = (msg) => {
    // console.log(msg)
    var copy = this.state.chatMessages.slice()

    copy.push(msg)

    this.setState({
      chatMessages: copy
    })

    this.forceUpdate()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    var width = window.innerWidth * .65
    var height = width * (9 / 16)

    this.setState({
      playerWidth: (width) + 'px',
      playerHeight: (height) + 'px',
    })

    this.getCurrentVideo()


  }

  // This function is called when the sortable list is sorted
  onSortEnd = ({ oldIndex, newIndex }) => {
    if(oldIndex !== newIndex){
      var newCurrentPlaylist = { playlistTitle: this.state.currentPlaylist.playlistTitle, playlistVideos: arrayMove(this.state.currentPlaylist.playlistVideos, oldIndex, newIndex) }

      this.setState({
        currentPlaylist: newCurrentPlaylist,
      });
  
      // if(newIndex === 0){
      //   video = newCurrentPlaylist.playlistVideos[0].videoId
      //   this.forceUpdate()
      // }
  
      this.setBackEndPlaylist(newCurrentPlaylist)
  
      // console.log('OnSortEnd')
      // console.log(newCurrentPlaylist)
      this.setBackendCurrentPlaylist(newCurrentPlaylist)
    }

    

  }

  onReady = (event) => {
    // access to player in all event handlers via event.target
    this.setState({
      player: event.target
    });

    event.target.setVolume(10)
  }

  onPlayerStateChange = (event) => {
    // console.log('state data = ' + event.data)
    if (event.data === 0) {
      // this.skipCurrentVideo()
    }
  }

  skipCurrentVideo = () => {

    if (this.state.currentPlaylist.playlistVideos.length > 0) {
      console.log('skipping')
      var topItem = this.state.currentPlaylist.playlistVideos.splice(0, 1)
      var listCopy = this.state.currentPlaylist.playlistVideos.slice()

      listCopy.push(topItem[0])
      // video = listCopy[0].videoId

      var newPlaylist = { playlistTitle: this.state.currentPlaylist.playlistTitle, playlistVideos: listCopy }

      this.updatePlaylistState(newPlaylist)

      this.setState({
        currentPlaylist: newPlaylist
      })

      this.forceUpdate()

      // console.log('skip current video')
      // console.log(newPlaylist)
      this.setBackendCurrentPlaylist(newPlaylist)

    } else {
      alert('There are no videos in the current playlist')
    }

  }

  sendMessage = (msg) => {
    socket.send(msg)
  }

  onShowAddVideoModal = () => {
    this.setState({
      showAddVideoModal: true
    })
  }

  onCloseAddVideoModal = () => {
    this.setState({
      showAddVideoModal: false,
      searchList: [],
      addVideoSearchTerm: ''
    })
  }

  handleAddVideoIDChange = (event) => {
    this.setState({
      addVideoSearchTerm: event.target.value
    })
  }

  onAddVideoSearch = (e) => {
    if (e !== undefined) {
      e.preventDefault();
    }

    var q = this.state.addVideoSearchTerm
    var maxResults = 25
    var url = 'https://www.googleapis.com/youtube/v3/search?q=' + q + '&key=' + youtubeAPIKey + '&maxResults=' + maxResults + '&part=snippet'

    if (q.length >= 1) {
      var idString = ''

      Axios.get(url)
        .then(response => {
          console.log(response)

          var results = response['data']['items']
          var searchList = []

          for (var i = 0; i < results.length; i++) {
            var item = results[i]

            var videoId = item['id']['videoId']
            var videoTitle = item['snippet']['title']

            idString += videoId + ','

            if (videoId !== undefined) {
              //add videos to a list to be displayed on the modal
              searchList.push({ videoId: videoId, videoTitle: videoTitle, duration: '' })

            }

          }

          idString = idString.substring(0, idString.length - 1)
          var getVideoDurationUrl = 'https://www.googleapis.com/youtube/v3/videos?id=' + idString + '&part=contentDetails&key=' + youtubeAPIKey

          Axios.get(getVideoDurationUrl)
            .then((response) => {
              // console.log(response)

              var durationRes = response['data']['items']

              for (var i = 0; i < durationRes.length; i++) {
                var duration = Moment.duration(durationRes[i]['contentDetails']['duration']).format('h:mm:ss').padStart(4, '0:0')

                searchList[i].duration = duration
              }

              this.setState({
                searchList: searchList
              })

              this.forceUpdate()


            })


        })

    }

  }

  //add new item to the front end playlist
  //also call backend to update record
  onSearchListItemClicked = (index) => {

    //Make a copy of the current playlist's videos
    var list = this.state.currentPlaylist.playlistVideos.slice()
    //Make a copy of the video search results
    var searchRes = this.state.searchList.slice()

    //Add the clicked video to the copy of the current playlist's videos
    list.push(searchRes[index])

    //Make a new object for the playlists state
    var newPlaylist = { playlistTitle: this.state.currentPlaylist.playlistTitle, playlistVideos: list }

    this.updatePlaylistState(newPlaylist)

    this.setState({
      currentPlaylist: newPlaylist
    })

    this.forceUpdate()

    //Update backend for new video
    this.addVideoToPlaylist(searchRes[index])

    // console.log('onSearchListItemClicked')
    this.setBackendCurrentPlaylist(newPlaylist)

  }

  //This function is used to update the playlists state with an updated playlist
  //Finds the playlist with the same name as the new playlist and replaces it
  updatePlaylistState = (newPlaylist) => {
    //Make a copy of all the playlists
    var playlistsCopy = this.state.playlists.slice()

    //Find the playlist that was just changed in the copy
    //Switch the old playlist with the new one
    for (var i = 0; i < playlistsCopy.length; i++) {
      if (playlistsCopy[i].playlistTitle === newPlaylist.playlistTitle) {
        playlistsCopy[i] = newPlaylist
      }
    }

    this.setState({
      playlists: playlistsCopy
    })

    this.forceUpdate()
  }

  //This function is used for adding a video to the current backend playlist
  addVideoToPlaylist = (video) => {

    var data = {
      username: this.state.currentUser,
      playlistTitle: this.state.currentPlaylist.playlistTitle,
      videoId: video['videoId'],
      videoTitle: video['videoTitle']
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'

    var url = apiEndpoint + '/addVideoToPlaylist'
    Axios.post(url, data)
      .then((response) => {
        // console.log(response)
      })

  }

  getVideoTitle = (videoId) => {
    var url = 'https://www.googleapis.com/youtube/v3/videos?key=' + youtubeAPIKey + '&id=' + videoId + '&part=snippet'
    var title = ''
    Axios.get(url)
      .then((response) => {
        return response['data']['items'][0]['snippet']['title']
      })

    return title
  }

  //This function is usually called when returning the playlist for a user from the DB
  //The function goes through each item in the list provided and adds it to current playlist
  setFrontEndPlaylist = (playlists) => {
    // console.log('frontend')
    // console.log(playlists)
    var currentPlaylistVideos = playlists['currentPlaylist']['playlistVideos']
    var videoList = []

    for (const item of currentPlaylistVideos) {
      var videoId = item['videoId']
      var videoTitle = item['videoTitle']

      var obj = { videoId: videoId, videoTitle: videoTitle }

      videoList.push(obj)

    }

    var newPlaylist = { playlistTitle: playlists['currentPlaylist']['playlistTitle'], playlistVideos: videoList }

    this.setState({
      currentPlaylist: newPlaylist
    })

    // if(videoList.length > 0){
    //   video = videoList[0]['videoId']

    // }

    //
    this.forceUpdate()

    // console.log('setFrontEndPlaylist')
    this.setBackendCurrentPlaylist(newPlaylist)


  }

  //This function is usually called after sorting a playlist
  //The function takes the current playlist and sends it to the backend to be put in the db
  setBackEndPlaylist = (newList) => {

    var data = {
      username: this.state.currentUser,
      playlistVideos: newList.playlistVideos,
      playlistTitle: newList.playlistTitle
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'

    var url = apiEndpoint + '/setPlaylist'

    Axios.post(url, data)
      .then((response) => {
        // console.log(response)
      })

  }

  getPlaylistsForCurrentUser = () => {
    var url = apiEndpoint + '/getPlaylists?username=' + this.state.currentUser
    Axios.get(url)
      .then((response) => {
        // console.log('response getPlaylistsForCurrentUser')
        // console.log(response)

        if (response.data.length !== 0) {
          this.setFrontEndPlaylist(response.data)

          this.setState({
            playlists: response.data.playlists,
            currentPlaylist: response.data.currentPlaylist
          })

        } else {
          // Disabling add video button so user can create a playlist
          this.setState({
            disableAddVideoButton: true
          })

          console.log('No Playlist for this user')
        }

      })
  }

  openPlaylistSlideIn = () => {
    this.setState({
      showPlaylistSlideIn: true
    })
  }

  closePlaylistSlideIn = () => {
    this.setState({
      showPlaylistSlideIn: false
    })
  }

  changeCurrentPlaylist = (index) => {
    var playlistsCopy = this.state.playlists.slice()
    var newPlaylist = playlistsCopy[index]

    if (newPlaylist.playlistTitle === this.state.currentPlaylist.playlistTitle) {
      alert("The selected playlist is already the current playlist")
    } else {

      this.setState({
        currentPlaylist: newPlaylist
      })

      this.forceUpdate()

      // console.log('changeCurrentPlaylist')
      this.setBackendCurrentPlaylist(newPlaylist)

      this.closePlaylistSlideIn()

      this.forceUpdate()

    }

  }

  setBackendCurrentPlaylist = (currentPlaylist) => {
    // console.log(currentPlaylist)

    var data = {
      username: this.state.currentUser,
      newCurrentPlaylist: currentPlaylist
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'

    var url = apiEndpoint + '/setCurrentPlaylist'

    Axios.post(url, data)
      .then((response) => {
        // console.log(response)
      })
  }

  testButton = () => {
    var url = apiEndpoint + '/getPlaylists?username=' + this.state.currentUser
    Axios.get(url)
      .then((response) => {
        // console.log(response)
      })
  }

  openAddPlaylistModal = () => {
    this.setState({
      showAddPlaylistModal: true
    })
  }

  closeAddPlaylistModal = () => {
    this.setState({
      showAddPlaylistModal: false
    })
  }

  handleNewPlaylistNameChange = (event) => {
    this.setState({
      newPlaylistNameInput: event.target.value
    })
  }

  makeNewPlaylist = (e) => {
    if (e !== undefined) {
      e.preventDefault();
    }

    // Make copy of playlists
    var playlistCopy = this.state.playlists.slice()

    // Create new playlist object
    var newPlaylist = { playlistTitle: this.state.newPlaylistNameInput, playlistVideos: [] }

    // Check if name is already a playlist
    var isDuplicatePlaylistName = false
    for (var i = 0; i < playlistCopy.length; i++) {
      if (this.state.newPlaylistNameInput === playlistCopy[i].playlistTitle) {
        isDuplicatePlaylistName = true
      }
    }

    // If the playlist name is not taken
    if (!isDuplicatePlaylistName) {
      playlistCopy.push(newPlaylist)

      this.setState({
        playlists: playlistCopy,
        currentPlaylist: newPlaylist
      })

      if(this.state.disableAddVideoButton){
        this.setState({
          disableAddVideoButton: false
        })
      }else {
        this.setBackendCurrentPlaylist(newPlaylist)
      }

      this.setBackEndPlaylist(newPlaylist)

      

      this.closeAddPlaylistModal()
    } else {
      alert('This playlist name is already used')
    }


    this.setState({
      playlists: playlistCopy
    })
  }

  //This function should only be used for debugging
  onClickListVideo = (index) => {
    // console.log('callback')
    // console.log('Index = ' + index)

    video = this.state.currentPlaylist.playlistVideos[index].videoId

    this.forceUpdate()
  }

  onClickDeleteCallback = (index) => {
    // console.log('Index = ' + index)

    // Delete from frontend stuff

    // Delete from current playlist
    var cpCopy = this.state.currentPlaylist
    var deletedVideo = cpCopy.playlistVideos.splice(index, 1)[0]

    // Delete from playlist state
    this.updatePlaylistState(cpCopy)

    this.setState({
      currentPlaylist: cpCopy
    })

    // call backend to delete video off playlist
    // this.deleteVideoFromBackend(deletedVideo, cpCopy.playlistTitle)
    this.setBackEndPlaylist(cpCopy)

    // console.log('onClickDeleteCallback')
    this.setBackendCurrentPlaylist(cpCopy)


  }

  // Apparently, Pymongo can't remove one element at a time so if there was a duplicate video in a playlist, both would be deleted
  // New idea, delete video from front end, the set backend list to the front end list
  // I will leave this function for possible future use
  deleteVideoFromBackend = (deletedVideo, playlistTitle) => {
    var data = {
      videoId: deletedVideo.videoId,
      videoTitle: deletedVideo.videoTitle,
      playlistTitle: playlistTitle,
      username: this.state.currentUser
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'

    var url = apiEndpoint + '/deleteVideoInPlaylist'

    Axios.post(url, data)
      .then((response) => {
        // console.log(response)
      })

  }

  // This function is called when a use joins the DJ queue
  // Sends the username to the server
  onJoinDJ = () => {
    socket.emit('Event_joinDJ',
      {
        user: this.state.currentUser
      }
    )

    this.setState({
      isUserDJing: true
    })

    this.forceUpdate()
  }

  //Enable this for production
  onPlayerPause = (event) => {
    event.target.playVideo()
  }

  handleMessageBoxChange = (event) => {
    this.setState({
      messageBoxValue: event.target.value
    })
  }

  handleSendChatMessage = (e) => {
    if (e !== undefined) {
      e.preventDefault();
    }

    socket.emit('Event_sendChatMessage',
      {
        user: this.state.currentUser,
        message: this.state.messageBoxValue
      }
    )

    this.setState({
      messageBoxValue: ''
    })

    this.forceUpdate()
  }

  handleReceiveChatMessage = (data) => {

    var user = data.user
    var message = data.message

    this.state.chatMessages.push(user + ": " + message)
    this.forceUpdate();
  }

  //Called when server sends new video to clients
  handleNextVideo = (data) => {

    var user = data.username
    var videoId = data.videoId
    var videoTitle = data.videoTitle

    // console.log('handle next video')
    // console.log(data)

    video = videoId

    this.setState({
      startTime: 0
    })

    if (user == this.state.currentUser) {
      //sorts the playlist after users video is picked to be played
      var newCurrentPlaylist = { playlistTitle: this.state.currentPlaylist.playlistTitle, playlistVideos: arrayMove(this.state.currentPlaylist.playlistVideos, 0, this.state.currentPlaylist.playlistVideos.length - 1) }

      // console.log('userPlayingVideo in new video = ' + user)
      // console.log('currentVideoTitle in new video = ' + videoTitle)

      this.setState({
        currentPlaylist: newCurrentPlaylist        
      });
    }

    this.setState({
      userPlayingVideo: user,
      currentVideoTitle: videoTitle
    })

    this.forceUpdate()
  }

  onLeaveDJ = () => {
    socket.emit('Event_leaveDJ',
      {
        user: this.state.currentUser
      }
    )

    this.setState({
      isUserDJing: false
    })

    this.forceUpdate()
  }

  onSkipVideo = () => {
    socket.emit('Event_skipCurrentVideo',
      {
        user: this.state.currentUser
      }
    )
  }

  onVolumeChange = (value) => {
    // console.log(value)

    this.state.player.setVolume(value)
  }

  onToggleMutePlayer = () => {
    if(this.state.player.isMuted()){
      this.state.player.unMute()
    }else {
      this.state.player.mute()
    }
  }

  getPlayerVolume = () => {
    if(this.state.player === null || this.state.player.getVolume() === undefined){
      setTimeout(this.getPlayerVolume, 100)
    }else {
      // console.log("player vol = " + this.state.player.getVolume())
      return this.state.player.getVolume()
    }
  }

  getPlayerIsMuted = () => {
    if(this.state.player === null || this.state.player.isMuted() === undefined){
      setTimeout(this.getPlayerIsMuted, 100)
    }else {
      // console.log("player vol = " + this.state.player.getVolume())
      return this.state.player.isMuted()
    }
  }

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  handleTabSelect = (key) => {
    this.setState({
      tabKey: key
    })
  }



  render() {

    const opts = {
      width: this.state.playerWidth,
      height: this.state.playerHeight,
      playerVars: { // https://developers.google.com/youtube/player_parameters
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        rel: 0,
        start: this.state.startTime
      }
    };

    var playlistSlideInTitle = 'Current Playlist: ' + this.state.currentPlaylist.playlistTitle

    return (
      <div>

        <div style={currentPlaylistStyle}>

          <fieldset style={{ 'border': 'p2' }}>
            <h3 style={{'textAlign':'center'}}>{this.state.currentPlaylist.playlistTitle}</h3>
          </fieldset>

        </div>

        <div style={listStyle}>
          <fieldset style={{ 'border': 'p2' }}>

            {this.state.disableAddVideoButton && 
              <OverlayTrigger placement="left" overlay={disabledAddVideoButtonTooltip} >
                <div style={{display: 'inline-block', cursor: 'not-allowed'}}>
                  <Button style={{'margin':'5px' }} 
                          onClick={this.onShowAddVideoModal} 
                          disabled>
                          
                  Add Video</Button>

                </div>
                
              </OverlayTrigger>
            }

            {!this.state.disableAddVideoButton &&
              <Button style={{ 'margin':'5px'}} 
                      onClick={this.onShowAddVideoModal}>
              
              Add Video</Button>
            
            }
            
            



            <Button style={{'margin':'5px'}} onClick={this.openPlaylistSlideIn}>Playlists</Button>
            
            <Button style={{'margin':'5px'}} onClick={() => this.onSkipVideo()}>Skip Video</Button>

            {!this.state.isUserDJing &&
              <Button style={{'margin':'5px'}} onClick={() => this.onJoinDJ()}>Click to DJ</Button>
            }

            {this.state.isUserDJing &&
              <Button style={{'margin':'5px'}} onClick={() => this.onLeaveDJ()}>Quit DJing</Button>
            }

            {/* <Button style={{ 'marginLeft': '10px' }} onClick={() => this.onLeaveDJ()}>Test</Button> */}




            <div style={{ 'marginTop': '10px' }}>
              <SortableList
                items={this.state.currentPlaylist.playlistVideos}
                onSortEnd={this.onSortEnd}
                distance={5}
                onClickDeleteCallback={this.onClickDeleteCallback} />
            </div>

          </fieldset>
        </div>

        <div style={playerStyle}>
          <YouTube
            videoId={video}
            opts={opts}
            onReady={this.onReady}
            onStateChange={this.onPlayerStateChange}
            onPause={this.onPlayerPause} />

        </div>











        <div >
          <Tabs
            activeKey={this.state.tabKey}
            onSelect={this.handleTabSelect}
            animation={false}
            style={{'width':'21%', 'right':'0px', 'position':'fixed', 'bottom':'35%', 'backgroundColor':'#fff'}}>

            <Tab style={tabStyle} eventKey={1} title="Chat">

              <div>

                {/* Messages div */}
                <div style={{'position':'absolute', 'width':'100%', 'background': '#9699a0', 'height':'87.5%', 'overflowY':'auto'}}>

                  <fieldset>
                    <div>
                      {this.state.chatMessages.map((value, index) => {
                        return (
                          <h6 style={{ 'color': 'white', 'font-size': '100%', 'marginLeft':'5px'}}>{value}</h6>
                        )
                      })}

                      <div style={{ float:"left", clear: "both" }}
                          ref={(el) => { this.messagesEnd = el; }}>
                      </div>

                    </div>
                  </fieldset>

                </div>




                  
                {/* Text box div */}
                <div style={{'position':'absolute', 'width':'100%', 'background': '#9699a0', 'height':'12%', 'bottom':'0', 'padding':'5px', 'display':'flex'}}>


                  <form onSubmit={(e) => this.handleSendChatMessage(e)}>
                    <div style={{ 'position':'relative', 'left':'5px', 'marginTop':'3px' }}>

                      <span style={{'color': 'white', 'marginRight':'5px', 'marginLeft':'-5px' }}>
                        {this.state.currentUser + ":"}
                      </span>

                      <input value={this.state.messageBoxValue} onChange={this.handleMessageBoxChange} style={{ 'background': '#9699a0', 'color': 'white' }}></input>
                      
                    </div>

                  </form>

                  <Button style={{'position':'absolute', 'right':'5px', 'top':'2px'}} onClick={(e) => this.handleSendChatMessage(e)}>Send</Button>


                </div>


              </div>



            </Tab>
            <Tab eventKey={2} title="Connected Users" style={tabStyle}>

              <div style={messagesStyle}>
                {this.state.clients.map((value, index) => {
                  return (
                    <h6 style={{ 'color': 'white', 'font-size': '100%', 'marginLeft':'5px'}}>{value.user}</h6>
                  )
                })}

                {/* <div style={{ float:"left", clear: "both" }}
                    ref={(el) => { this.messagesEnd = el; }}>
                </div> */}
              </div>

            </Tab>
            <Tab eventKey={3} title="DJ Queue" style={tabStyle}>
              
              <div style={messagesStyle}>
                {this.state.DJQueue.map((value, index) => {
                  return (
                    <h6 style={{ 'color': 'white', 'font-size': '100%', 'marginLeft':'5px'}}>{value}</h6>
                  )
                })}

                {/* <div style={{ float:"left", clear: "both" }}
                    ref={(el) => { this.messagesEnd = el; }}>
                </div> */}
              </div>

            </Tab>

          </Tabs>
        </div>
        












        <Modal show={this.state.showAddVideoModal} onHide={this.onCloseAddVideoModal} bsSize='large'>
          <Modal.Header closeButton>
            <Modal.Title>Add Video to List</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ 'overflowY': 'auto' }}>

              <form onSubmit={(e) => this.onAddVideoSearch(e)}>
                <input value={this.state.addVideoSearchTerm} onChange={this.handleAddVideoIDChange} />
                <Button onClick={(e) => { this.onAddVideoSearch(e) }}>Search</Button>
              </form>

              <ListGroup>
                {this.state.searchList.map((value, index) => {
                  var imageLink = 'http://img.youtube.com/vi/' + value.videoId + '/0.jpg'

                  return (
                    <ListGroupItem onClick={() => this.onSearchListItemClicked(index)}>
                      <div style={{ 'position': 'relative' }}>
                        <img src={imageLink} style={{ 'width': '120px', 'height': '90px' }} />
                        <h5 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px', 'wordWrap': 'break-all' }}>{value.videoTitle}</h5>
                        <p style={{ 'display': 'inline-block', 'position': 'absolute', 'right': '0px', 'top': '40%' }}>{value.duration}</p>
                      </div>
                    </ListGroupItem>
                  )

                })}
              </ListGroup>

            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.onCloseAddVideoModal}>Close</Button>
          </Modal.Footer>
        </Modal>

        <Slider
          title={playlistSlideInTitle}
          isOpen={this.state.showPlaylistSlideIn}
          onOutsideClick={this.closePlaylistSlideIn}
          header={
            <div style={{ 'position': 'fixed','right': '5px', 'position': 'fixed', 'top': '15px' }}>
                {this.state.showPlaylistSlideIn &&
                  <Button style={{  }} onClick={this.openAddPlaylistModal}>Add Playlist</Button>
                }
            </div>
          }
          footer={
            <div style={{'position':'fixed', 'right':'5px'}}>
              {this.state.showPlaylistSlideIn &&
                <Button onClick={this.closePlaylistSlideIn}>Close Slider</Button>
              }
            </div> 
            
          }>

          <div>
            <ListGroup>
              {this.state.playlists.map((value, index) => {
                var title = value.playlistTitle
                var videos = value.playlistVideos

                if (title != '') {
                  return (
                    <ListGroupItem style={{ 'position': 'relative' }} onClick={() => this.changeCurrentPlaylist(index)}>
                      <h5 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px', 'wordWrap': 'break-all' }}>{title}</h5>
                      <h6 style={{ 'display': 'inline-block', 'marginLeft': '2px' }}>({videos.length})</h6>
                    </ListGroupItem>
                  )
                }

              })}
            </ListGroup>
          </div>

        </Slider>

        <Modal show={this.state.showAddPlaylistModal} onHide={this.closeAddPlaylistModal} bsSize='large'>
          <Modal.Header closeButton>
            <Modal.Title>Add New Playlist</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ 'overflowY': 'auto' }}>

              <form onSubmit={(e) => this.makeNewPlaylist(e)}>
                <input value={this.state.newPlaylistNameInput} onChange={this.handleNewPlaylistNameChange} />
                <Button onClick={(e) => { this.makeNewPlaylist(e) }}>Add</Button>
              </form>

            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeAddPlaylistModal}>Close</Button>
          </Modal.Footer>
        </Modal>

        <Playbar 
            onSliderChange={this.onVolumeChange} 
            onToggleMutePlayer={this.onToggleMutePlayer} 
            getPlayerVolume={this.getPlayerVolume} 
            getPlayerIsMuted={this.getPlayerIsMuted}
            userPlayingVideo={this.state.userPlayingVideo}
            currentVideoTitle={this.state.currentVideoTitle}/>

      </div>
    );
  }
}

export default App;
