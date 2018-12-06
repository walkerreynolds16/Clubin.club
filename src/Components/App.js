import React, { Component } from 'react';
import Playbar from '../Components/Playbar';
import YouTube from 'react-youtube';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { Button, ListGroup, ListGroupItem, Modal, Tooltip, OverlayTrigger, Tab, Tabs, ButtonToolbar, DropdownButton, Dropdown, MenuItem,Glyphicon } from 'react-bootstrap';
import Slider from 'react-slide-out'
import Axios from 'axios'
import '../Styles/App.css';
import 'react-slide-out/lib/index.css'
import Moment from 'moment'
import 'moment-duration-format'
import shuffle from 'shuffle-array'
import {API_ENDPOINT} from '../api-config.js'
import Leaderboard from '../Components/Leaderboard'


import openSocket from 'socket.io-client';

// const apiEndpoint = 'http://127.0.0.1:5000'
// const apiEndpoint = 'https://plug-dj-clone-api.herokuapp.com'
const apiEndpoint = API_ENDPOINT


const socket = openSocket.connect(apiEndpoint, {transports: ['websocket']})


var video = ''
const youtubeAPIKey = 'AIzaSyD7edp0KrX7oft2f-zL2uEnQFhW4Uj5OvE'

const currentPlaylistStyle = {
  display: 'inline-block',
  position: 'fixed',
  width: '35%',
  top: '0px',
  right: '0px',
  background: '#9699a0',
  border: '2px double #74757E',
  height: '7%'
}

const listStyle = {
  display: 'inline-block',
  position: 'fixed',
  width: '35%',
  top: '60px',
  right: '0px',
  background: '#9699a0',
  border: '2px double #74757E',
  height: '65%'
}

const playerStyle = {
  display: 'inline',
  position: 'relative',
  left: '0px',
  top: '0px'
}

const tabStyle = {
  position: 'fixed',
  height:'25%',
  width: '35%',
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

const SortableItem = SortableElement(({ value, onClickDeleteCallback, onClickMoveToBottom, onClickMoveToTop, listIndex, getPlaylistforCopy }) => {
  var image = 'https://img.youtube.com/vi/' + value.videoId + '/0.jpg'

  return (
    <div style={{ 'marginTop': '8px', 'marginBottom': '8px', 'position': 'relative' }}>
      <li style={{ 'display': 'flex', 'alignItems': 'center' }}>
        <img src={image} style={{ 'width': '80px', 'height': '55px' }} alt={listIndex} />
        <h6 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px' }}>{value.videoTitle}</h6>

        <div style={{ 'display': 'inline-block', 'position': 'absolute', 'right': '5px' }}>
       
        <Dropdown pullRight title="Menu" id="menu-nav-dropdown">

            <Dropdown.Toggle noCaret inverse>
              <Glyphicon glyph="option-vertical" />
            </Dropdown.Toggle>

            
            <Dropdown.Menu>
            <MenuItem onSelect={() => onClickMoveToTop(listIndex)}>Move To Top</MenuItem>
            <MenuItem onSelect={() => onClickMoveToBottom(listIndex)}>Move To Bottom</MenuItem>
            <MenuItem onSelect={() => getPlaylistforCopy(value)}>Copy To Another Playlist</MenuItem>
            <MenuItem divider />
            <MenuItem onSelect={() => onClickDeleteCallback(listIndex)}>Delete</MenuItem>            
            </Dropdown.Menu>
          </Dropdown>
            

        
        </div>
      </li>
    </div>

  );
});

const SortableList = SortableContainer(({ items, onClickDeleteCallback, onClickMoveToBottom, onClickMoveToTop,getPlaylistforCopy }) => {
  return (
    <div style={{ 'overflow': 'auto', 'position':'absolute', 'height':'100%', 'width':'100%' }}>
      <ul>
        {items.map((value, index) => (

          <SortableItem key={`item-${index}`} index={index} value={value} onClickDeleteCallback={onClickDeleteCallback} onClickMoveToBottom={onClickMoveToBottom} onClickMoveToTop={onClickMoveToTop}listIndex={index} getPlaylistforCopy={getPlaylistforCopy} />
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

    this.playbarRef = React.createRef()

    this.state = {
      currentPlaylist: { playlistTitle: '', playlistVideos: [] },
      showAddVideoModal: false,
      addVideoSearchTerm: '',
      playerWidth: '',
      playerHeight: '',
      searchList: [],
      currentUser: this.props.loginUsername,
      showPlaylistSlideIn: false,
      playlists: [],
      //searchedVideos: [],
      showAddPlaylistModal: false,
      showVideoHistoryModal: false,
      videoHistory: [],
      newPlaylistNameInput: '',
      chatMessages: [],
      userPlayingVideo: '',
      currentVideoTitle: '',
      messageBoxValue: '',
      playlistSearchBoxValue: '',
      isUserDJing: false,
      testSetUsername: '',
      startTime: 0,
      player: null,
      disableAddVideoButton: false,
      clients: [],
      DJQueue: [],
      tabKey: 1,
      showImportYoutubeModal: false,
      importPlaylistId: '',
      importPlaylistTitle: '',
      currentVersion: '',
      wooters: [],
      mehers: [],
      grabbers: [],
      wooted: false,
      mehed: false,
      grabbed: false,
      showGrabMenu: false,
      admins: [],
      isAdmin: false,
      showAdminModal: false,
      hasSkipped: false,
      skippers: [],
      chaosSkipMode: false,
      leaderboardList: [],
      showLeaderboard: false,
      adminRemoveUserInput: '',
      showCopyModal: false,
      videoToCopy: null,
      showRenameModal: false,
      renameBoxValue: '',
      playlistToRename: null,
    }
  }


  componentDidMount() {

    this.getCurrentVersion()

    this.updateWindowDimensions()
    // window.addEventListener('resize', this.updateWindowDimensions);

    window.addEventListener("beforeunload", (ev) => this.handleWindowClose(ev));

    this.getPlaylistsForCurrentUser()

    this.getCurrentVideoMetrics()

    socket.on('Event_userConnecting', (data) => this.handleUserConnecting(data))

    socket.on('message', (msg) => this.handleMessage(msg))

    socket.on('Event_receiveChatMessage', (data) => this.handleReceiveChatMessage(data))

    socket.on('Event_nextVideo', (data) => this.handleNextVideo(data))

    socket.on('Event_stopVideo', () => this.handleStopVideo())

    socket.on('Event_DJQueueChanging', (DJs) => this.handleDJQueueChange(DJs))
    
    socket.on('Event_userDisconnecting', (data) => this.handleUserDisconnecting(data))

    socket.on('Event_wootChanged', (data) => this.handleWootChange(data))

    socket.on('Event_mehChanged', (data) => this.handleMehChange(data))

    socket.on('Event_grabChanged', (data) => this.handleGrabChange(data))

    socket.on('Event_skipChanged', (data) => this.handleSkipChange(data))    
    
    socket.on('Event_chaosSkipModeChanged', (data) => this.handleChaosSkipModeChanged(data))
    
    socket.on('Event_leaderboardChanged', (data) => this.handleLeaderBoardChange(data))


    this.getAdmins()

    this.startKeepBackendAlive()

    this.handleConnect()

    

  }

  handleLeaderBoardChange = (data) => {
    console.log("leaderboard change")
    console.log(data)

    this.setState({
      leaderboardList: data
    })
  }

  handleChaosSkipModeChanged = (data) => {
    console.log('handleChaosSkipModeChanged')
    console.log(data)

    this.setState({
      chaosSkipMode: data
    })
  }

  getAdmins = () => {
    var url = apiEndpoint + '/getAdmins'
    Axios.get(url)
      .then((response) => {
        console.log(response)

        var admins = response['data']
        var isAdmin = false

        if(admins.includes(this.state.currentUser)){
          console.log('IM AN ADMIN')
          isAdmin = true
        }

        this.setState({
          admins: admins,
          isAdmin: isAdmin
        })

      })
  }

  startKeepBackendAlive = () => {
    var intervalTime = (60 * 10) * 1000

    this.getCurrentVersion()

    setTimeout(this.startKeepBackendAlive, intervalTime)
  }

  getCurrentVideoMetrics = () => {
    var url = apiEndpoint + '/getCurrentVideoMetrics'
    Axios.get(url)
      .then((response) => {
        console.log(response)
        this.setState({
          wooters: response['data']['wooters'],
          mehers: response['data']['mehers'],
          grabbers: response['data']['grabbers']
        })

        if(response.data.wooters.indexOf(this.state.currentUser) >= 0){
          this.setState({
            wooted: true
          })
        }else if(response.data.mehers.indexOf(this.state.currentUser) >= 0){
          this.setState({
            mehed: true
          })
        }else if(response.data.grabbers.indexOf(this.state.currentUser) >= 0){
          this.setState({
            grabbed: true
          })
        }

      })
  }

  handleSkipChange = (data) => {
    console.log('Skippers =  ' + data.skippers)
    console.log('# of Skippers' + data.skippers.length)

    this.setState({
      skippers: data.skippers
    })
  }

  handleWootChange = (data) => {
    console.log('Wooters =  ' + data.wooters)
    console.log('# of woots' + data.wooters.length)

    this.setState({
      wooters: data.wooters
    })
  }

  handleMehChange = (data) => {
    console.log('Mehers =  ' + data.mehers)
    console.log('# of mehs' + data.mehers.length)

    this.setState({
      mehers: data.mehers
    })
  }

  handleGrabChange = (data) => {
    console.log('Grabbers =  ' + data.grabbers)
    console.log('# of grabs' + data.grabbers.length)

    this.setState({
      grabbers: data.grabbers
    })
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

    // console.log("DJQueue")
    // console.log(data.djQueue)

    // console.log("Skippers")
    // console.log(data.skippers)

    this.setState({
      clients: data.clients,
      DJQueue: data.djQueue,
      skippers: data.skippers
    })

    this.forceUpdate()
  }

  handleUserConnecting = (data) => {
    // console.log(data.user + " is connecting")

    // console.log(data.clients)

    this.setState({
      clients: data.clients,
      DJQueue: data.djQueue,
      skippers: data.skippers,
      chaosSkipMode: data.chaosSkipMode
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
      currentVideoTitle: '',
      wooted: false,
      mehed: false,
      grabbed: false,
      wooters: [],
      mehers: [],
      grabbers: []
    })
    
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  handleConnect = () => {
    socket.emit('Event_userConnected', this.state.currentUser)

    // this.getCurrentVideo()

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

      this.updatePlaylistState(newCurrentPlaylist)

  
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
    if(event.data === -1){
      this.playbarRef.current.stopTimer()

    }else if (event.data === 0) {
      socket.emit('Event_userFinishedVideo', this.state.currentUser)
      this.playbarRef.current.stopTimer()

    }else if(event.data === 1){
      this.playbarRef.current.startTimer()

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

  onShowVideoHistoryModal = () => {
    this.setState({
      showVideoHistoryModal: true
    })
  }

  onCloseVideoHistoryModal = () =>{
    this.setState({
      showVideoHistoryModal: false
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
          // console.log(response)

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
    list.unshift(searchRes[index])

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

  adminRemoveUserInputChange = (event) => {
    this.setState({
      adminRemoveUserInput: event.target.value
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
      playlists: playlistCopy,
      newPlaylistNameInput: ''
    })
  }

  openRenamePlaylist = (index) => {
    this.openRenameModal()
    this.setState({
      playlistToRename: index
    })
  }

  renamePlaylist = (e) => {
    if (e !== undefined)
    {
      e.preventDefault()
    }

    var copyOfPlaylists = this.state.playlists.slice()
    var index = this.state.playlistToRename

    //console.log(this.state.renameBoxValue)
    console.log(copyOfPlaylists[index].playlistTitle)

   

    copyOfPlaylists[index].playlistTitle = this.state.renameBoxValue


    console.log(copyOfPlaylists[index].playlistTitle)

    //this.updatePlaylistState(playlist)

    this.setState({
      playlists: copyOfPlaylists,
      showRenameModal: false,
      renameBoxValue: '',
      playlistToRename: null
    })

    this.setBackEndPlaylist(copyOfPlaylists[index])

    this.forceUpdate()
  }

  openRenameModal = () => {
    this.setState({
      showRenameModal: true
    })
  }

  closeRenameModal = () => {
    this.setState({
      showRenameModal: false
    })
  }

  handleRenameBoxValue = (event) => {
    this.setState({
      renameBoxValue: event.target.value
    })
  }

  //This function should only be used for debugging
  onClickListVideo = (index) => {
    // console.log('callback')
    // console.log('Index = ' + index)

    video = this.state.currentPlaylist.playlistVideos[index].videoId

    this.forceUpdate()
  }

  onClickMoveToBottom =(index) => {

    var cpCopy = this.state.currentPlaylist
    var videoToMove = cpCopy.playlistVideos.splice(index,1)[0]

    cpCopy.playlistVideos.push(videoToMove);

    this.updatePlaylistState(cpCopy)

    this.setState({
      currentPlaylist: cpCopy
    })

    this.setBackEndPlaylist(cpCopy)

    // console.log('onClickDeleteCallback')
    this.setBackendCurrentPlaylist(cpCopy)

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
    var time = data.time

    this.state.chatMessages.push("["+time+"] "+user + ": " + message)
    this.forceUpdate();
  }

  //Called when server sends new video to clients
  handleNextVideo = (data) => {

    var user = data.username
    var videoId = data.videoId
    var videoTitle = data.videoTitle

    this.state.videoHistory.push(data)

    // console.log('handle next video')
    // console.log(data)

    video = videoId


    this.setState({
      startTime: 0
    })

    if (user === this.state.currentUser) {
      //sorts the playlist after users video is picked to be played
      
      var newCurrentPlaylist = { playlistTitle: this.state.currentPlaylist.playlistTitle, playlistVideos: arrayMove(this.state.currentPlaylist.playlistVideos, 0, this.state.currentPlaylist.playlistVideos.length - 1) }

      // console.log('userPlayingVideo in new video = ' + user)
      // console.log('currentVideoTitle in new video = ' + videoTitle)

      this.updatePlaylistState(newCurrentPlaylist)

      this.setState({
        currentPlaylist: newCurrentPlaylist        
      });
    }

    this.setState({
      userPlayingVideo: user,
      currentVideoTitle: videoTitle,
      wooted: false,
      mehed: false,
      grabbed: false,
      wooters: [],
      mehers: [],
      grabbers: [],
      hasSkipped: false,
      skippers: []
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

  onSkipVideo = (adminOverride = false) => {
    if(video !== ''){
      var override = this.state.userPlayingVideo === this.state.currentUser

      socket.emit('Event_skipCurrentVideo',
        {
          user: this.state.currentUser,
          isSkipping: !this.state.hasSkipped,
          overrideSkip: override || adminOverride
        }
      )

      this.setState({
        hasSkipped: !this.state.hasSkipped
      })
    }
    
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

  openYoutubeImportModal = () => {
    this.setState({
      showImportYoutubeModal: true
    })
  }

  closeYoutubeImportModal = () => {
    this.setState({
      showImportYoutubeModal: false
    })
  }

  handleImportPlaylistIdChange = (event) => {
    this.setState({
      importPlaylistId: event.target.value
    })
  }

  handleImportPlaylistTitleChange = (event) => {
    this.setState({
      importPlaylistTitle: event.target.value
    })
  }

  importPlaylistFromYoutube = (e) => {
    if (e !== undefined) {
      e.preventDefault();
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'

    var data = {
      'username': this.state.currentUser,
      'playlistId': this.state.importPlaylistId,
      'newPlaylistTitle': this.state.importPlaylistTitle
    }

    var url = apiEndpoint + '/createPlugDJPlaylistFromYoutubePlaylist'

    Axios.post(url, data)
      .then((response) => {
        // console.log(response)

        if(this.state.disableAddVideoButton){
          this.setState({
            disableAddVideoButton: false
          })
        }

        this.closeYoutubeImportModal()

        this.getPlaylistsForCurrentUser()

        this.closePlaylistSlideIn()
      })
  }

  getCurrentVersion = () => {
    var url = apiEndpoint + '/getCurrentVersion'
    Axios.get(url)
      .then((response) => {
        // console.log(response)
        this.setState({
          currentVersion: response['data']['version']
        })

      })
  }

  deletePlaylist = (index) => {

    console.log(this.state.playlists[index])

    // copy playlists and remove the playlist by index
    var newPlaylists = this.state.playlists.slice()
    var removedPlaylist = newPlaylists.splice(index, 1)

    // If the new playlist doesn't have anything in it anymore, disable add video/dj buttons
    if(newPlaylists.length === 0){
      this.setState({
        disableAddVideoButton: true,
        playlists: [],
        currentPlaylist: { playlistTitle: '', playlistVideos: [] }
      })

      this.deletePlaylistDocument()

    }else {
      this.setAllPlaylists(newPlaylists)
    }

    // If the removed playlist was the current playlist
    if(removedPlaylist[0].playlistTitle === this.state.currentPlaylist.playlistTitle){
      var newCurrentPlaylist = { playlistTitle: '', playlistVideos: [] }

      // if the new playlists have at least 1 playlist in it, make that the new current playlist
      if(newPlaylists.length > 0){
        newCurrentPlaylist = newPlaylists[0]
      }

      this.setState({
        currentPlaylist: newCurrentPlaylist
      })

      this.setBackendCurrentPlaylist(newCurrentPlaylist)
    }


    this.setState({
      playlists: newPlaylists
    })
    

    this.forceUpdate()
  }

  setAllPlaylists = (newPlaylists) => {
    var data = {
      username: this.state.currentUser,
      playlists: newPlaylists
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'

    var url = apiEndpoint + '/setAllPlaylist'

    Axios.post(url, data)
      .then((response) => {
        console.log(response)
      })
  }

  deletePlaylistDocument = () => {
    var data = {
      username: this.state.currentUser
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'

    var url = apiEndpoint + '/deletePlaylistDocument'

    Axios.post(url, data)
      .then((response) => {
        console.log(response)
      })
  }

  shufflePlaylist = (index) => {
    var playlistCopy = this.state.playlists.slice()
    playlistCopy[index].playlistVideos = shuffle(playlistCopy[index].playlistVideos)

    // shuffle playlist is also the current playlist
    if(playlistCopy[index].playlistTitle === this.state.currentPlaylist.playlistTitle){
      this.setState({
        currentPlaylist: playlistCopy[index]
      })

      this.setBackendCurrentPlaylist(playlistCopy[index])
    }

    // console.log(playlistCopy[index].playlistVideos)

    this.setAllPlaylists(playlistCopy)

    this.setState({
      playlists: playlistCopy
    })

    this.forceUpdate()
  }

  onClickWoot = () => {
    
    if(video !== '' && this.state.userPlayingVideo !== this.state.currentUser){
      if(this.state.mehed){
        this.onClickMeh()
      }

      socket.emit('Event_Woot',
        {
          user: this.state.currentUser,
          wooting: !this.state.wooted
        }
      )

      this.setState({
        wooted: !this.state.wooted
      })

      this.forceUpdate()
    }

    
  }

  onClickMeh = () => {

    if(video !== '' && this.state.userPlayingVideo !== this.state.currentUser){
      if(this.state.wooted){
        this.onClickWoot()
      }

      socket.emit('Event_Meh',
        {
          user: this.state.currentUser,
          mehing: !this.state.mehed
        }
      )

      this.setState({
        mehed: !this.state.mehed
      })

      this.forceUpdate()
    }
  }

  onClickGrab = () => {
    if(video !== '' && this.state.userPlayingVideo !== this.state.currentUser){

      this.setState({
        showGrabMenu: true
      })

      this.forceUpdate()
    }
  }

  closeGrabMenu = () => {
    this.setState({
      showGrabMenu: false
    })
  }

  grabToPlaylist = (index) => {
    if(!this.state.wooted){
      this.onClickWoot()
    }

    if(!this.state.grabbed){
      socket.emit('Event_Grab',
        {
          user: this.state.currentUser
        }
      )

      this.setState({
        grabbed: true
      })
    }
    

    var playlists = this.state.playlists.slice()
    var selectedPlaylist = playlists[index]

    var newVideo = {'videoId': video, 'videoTitle': this.state.currentVideoTitle}

    selectedPlaylist.playlistVideos.push(newVideo)

    this.updatePlaylistState(selectedPlaylist)

    if(this.state.currentPlaylist.playlistTitle === selectedPlaylist.playlistTitle){
      this.setState({
        currentPlaylist: selectedPlaylist
      })

      this.setBackendCurrentPlaylist(selectedPlaylist)
    }
    
    this.setBackEndPlaylist(selectedPlaylist)

    this.forceUpdate()
    
  }

  searchPlaylist = (e) =>{

    if(e !== undefined)
    {
      e.preventDefault();
    }

    var searchedVideos = []

    for(var i = 0; i < this.state.currentPlaylist.playlistVideos.length; i++)
    {
      var currentVid = this.state.currentPlaylist.playlistVideos[i]
      var vidTitle = currentVid['videoTitle']

      if(vidTitle.toLowerCase().indexOf(this.state.playlistSearchBoxValue.toLowerCase) !== -1)
      {
        /*This array holds the list of videos that have been found with the substring we get
        from above*/
        searchedVideos.push(currentVid)
      }
    }

    //var currentVideos = this.state.currentPlaylist.playlistVideos
    //this.state.currentPlaylist.currentPlaylistVideos = this.state.searchedVideos
    this.setState(
      {
        currentPlaylistVideos: searchedVideos
      }
    )

    this.forceUpdate();
  }

  handleSearchBoxChange = (event) => {
    this.setState({
      playlistSearchBoxValue: event.target.value

    })
  }
  
  showAdminModal = () => {
    this.setState({
      showAdminModal: true
    })
  }

  closeAdminModal = () => {
    this.setState({
      showAdminModal: false
    })
  }
  
  onClickMoveToTop = (index) => {
    var cpCopy = this.state.currentPlaylist
    var videoToMove = cpCopy.playlistVideos.splice(index,1)[0]

    cpCopy.playlistVideos.unshift(videoToMove);

    this.updatePlaylistState(cpCopy)

    this.setState({
      currentPlaylist: cpCopy
    })

    this.setBackEndPlaylist(cpCopy)

    // console.log('onClickDeleteCallback')
    this.setBackendCurrentPlaylist(cpCopy)
  }

  adminToggleChaosSkipMode = () => {
    socket.emit('Event_toggleChaosSkipMode')
  }

  showLeaderboard = () => {
    this.setState({
      showLeaderboard: true
    })
  }

  closeLeaderboard = () => {
    this.setState({
      showLeaderboard: false
    })
  }

  adminRemoveUser = () => {
    socket.emit('Event_userDisconnected', this.state.adminRemoveUserInput)
  }
  
  getPlaylistforCopy = (video) => {
    this.setState({
      videoToCopy: video
    })
    this.showCopyModal()
  }

  copyVideoToPlaylist = (playlist, index) => {

    var copyOfPlaylists = this.state.playlists.slice()
    var playlistIndex = copyOfPlaylists.indexOf(playlist)

    playlist.playlistVideos.push(this.state.videoToCopy)

    this.updatePlaylistState(playlist)

    copyOfPlaylists[playlistIndex] = playlist

     this.setState({
      playlists: copyOfPlaylists,
      videoToCopy: null,
      showCopyModal: false
    })


    this.setBackEndPlaylist(playlist)
    
    this.forceUpdate()
  }

  showCopyModal = () => {
    this.setState({
      showCopyModal: true
    })
  }

  closeCopyModal = () => {
    this.setState({
      showCopyModal: false
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
        start: this.state.startTime,
        iv_load_policy: 3
      }
    };

    var playlistSlideInTitle = 'Current Playlist: ' + this.state.currentPlaylist.playlistTitle
    var showVideoHistoryModal = 'Recently Played'


    return (
      <div>

        <div style={currentPlaylistStyle}>

          <fieldset style={{ 'border': 'p2' }}>
            <h3 style={{'textAlign':'center'}}>{this.state.currentPlaylist.playlistTitle}</h3>
          </fieldset>

        </div>

        <div style={listStyle}>
          <fieldset style={{ 'border': 'p2', 'textAlign':'center' }}>

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
            

            {this.state.chaosSkipMode &&
              <Button style={{'margin':'5px', 'backgroundColor':'#e50000'}} onClick={() => this.onSkipVideo()}>Skip Video</Button>
            }
            {!this.state.chaosSkipMode &&
              <Button style={{'margin':'5px'}} onClick={() => this.onSkipVideo()}>Skip Video</Button>
            }

            {!this.state.isUserDJing && this.state.disableAddVideoButton && 

              <OverlayTrigger placement="top" overlay={disabledAddVideoButtonTooltip} >
                <div style={{display: 'inline-block', cursor: 'not-allowed'}}>
                  <Button style={{'margin':'5px'}} onClick={() => this.onJoinDJ()} disabled>Click to DJ</Button>
                </div>
              </OverlayTrigger>

            }

            {!this.state.isUserDJing && !this.state.disableAddVideoButton &&
              <Button style={{'margin':'5px'}} onClick={() => this.onJoinDJ()}>Click to DJ</Button>
            }

            {this.state.isUserDJing &&
              <Button style={{'margin':'5px'}} onClick={() => this.onLeaveDJ()}>Quit DJing</Button>
            }

            {this.state.isAdmin && 
              <Button style={{'margin':'5px'}} onClick={() => this.showAdminModal()}>Admin Menu</Button>
            }


              {/*Search Box */}
            {/* <form onSubmit={(e) => this.searchPlaylist(e)}>
              <input value = {this.state.playlistSearchBoxValue} onChange={this.handleSearchBoxChange} style={{ 'background': '#6f7175', 'color': 'white', 'width':'30%' }}></input>

            </form>

            {<Button onClick={(e) => this.searchPlaylist(e)}>Search</Button> } */}

              <SortableList
                items={this.state.currentPlaylist.playlistVideos}
                onSortEnd={this.onSortEnd}
                distance={5}
                onClickDeleteCallback={this.onClickDeleteCallback}
                onClickMoveToBottom={this.onClickMoveToBottom}
                onClickMoveToTop={this.onClickMoveToTop}
                onClickCopyToPlaylist={this.copyVideoToPlaylist}
                getPlaylistforCopy = {this.getPlaylistforCopy} />
            

          </fieldset>
        </div>

        <div style={playerStyle}>
          <YouTube
            videoId={video}
            opts={opts}
            onReady={this.onReady}
            onStateChange={this.onPlayerStateChange}
            onPause={this.onPlayerPause}
            id="youtube" />

        </div>



        <div >
          <Tabs
            activeKey={this.state.tabKey}
            onSelect={this.handleTabSelect}
            animation={false}
            style={{'width':'35%', 'right':'0px', 'position':'fixed', 'bottom':'25%', 'backgroundColor':'#fff'}}
            id="Main Tabs">

            <Tab style={tabStyle} eventKey={1} title="Chat">

              <div>

                {/* Messages div */}
                <div style={{'position':'absolute', 'width':'100%', 'background': '#9699a0', 'height':'83.5%', 'overflowY':'auto'}}>

                  <fieldset>
                    <div>
                      {this.state.chatMessages.map((value, index) => {
                        return (
                          <h6 key={index+value} style={{ 'color': 'white', 'fontSize': '100%', 'marginLeft':'5px'}}>{value}</h6>
                        )
                      })}

                      <div style={{ float:"left", clear: "both" }}
                          ref={(el) => { this.messagesEnd = el; }}>
                      </div>

                    </div>
                  </fieldset>

                </div>




                  
                {/* Text box div */}
                <div style={{'position':'absolute', 'width':'100%', 'background': '#9699a0', 'height':'16%', 'bottom':'0', 'padding':'5px', 'display':'flex'}}>


                  <form onSubmit={(e) => this.handleSendChatMessage(e)}>
                    <div style={{ 'position':'relative', 'left':'5px', 'marginTop':'3px', 'width':'100%', 'position':'absolute' }}>

                      <span style={{'color': 'white', 'marginRight':'5px', 'marginLeft':'-5px' }}>
                        {this.state.currentUser + ":"}
                      </span>

                      <input value={this.state.messageBoxValue} onChange={this.handleMessageBoxChange} style={{ 'background': '#6f7175', 'color': 'white', 'width':'70%' }}></input>
                      
                    </div>

                  </form>

                  <Button style={{'position':'absolute', 'right':'5px', 'top':'2px'}} onClick={(e) => this.handleSendChatMessage(e)}>Send</Button>


                </div>


              </div>



            </Tab>
            <Tab eventKey={2} title={"Connected Users (" + this.state.clients.length + ")"} style={tabStyle}>

              <div style={messagesStyle}>
                {this.state.clients.map((value, index) => {
                  var username = value.user
                  var hasWooted = this.state.wooters.includes(username)
                  var hasMehed = this.state.mehers.includes(username)
                  var hasGrabbed = this.state.grabbers.includes(username)
                  var hasSkipped = this.state.skippers.includes(username)

                  return (
                    <div key={index + value} style={{'display':'flex', 'alignItems':'center'}}>
                      {hasSkipped &&
                        <h6 style={{ 'color': '#e50000', 'font-size': '100%', 'marginLeft':'5px', 'marginTop':'5px', 'marginBottom':'5px', }}>{value.user}</h6>
                      }

                      {!hasSkipped &&
                        <h6 style={{ 'color': 'white', 'font-size': '100%', 'marginLeft':'5px', 'marginTop':'5px', 'marginBottom':'5px', }}>{value.user}</h6>
                      }

                      {hasGrabbed && 
                        <svg viewBox="0 0 640 640" width="20" height="20" style={{'marginLeft':'5px'}}>
                          <path d="M389.25 250.79L544.09 272.19L432.05 375.98L458.49 522.55L320 453.35L181.51 522.55L207.96 375.98L95.91 272.19L250.76 250.79L320 117.45L389.25 250.79Z"
                                style={{'fill':'#9400D3'}}/>
                        </svg>
                      }

                      {hasMehed && 
                        <svg viewBox="0 0 640 640" width="20" height="20" style={{'marginLeft':'5px'}}>
                          <path d="M515.26 328.9L417.63 425.73L320 522.55L222.36 425.73L124.74 328.9L227.51 328.9L227.51 117.45L412.49 117.45L412.49 328.9L515.26 328.9Z"
                                style={{'fill':'#ff0000'}}/>
                        </svg>
                      }

                      {hasWooted && !hasGrabbed &&
                        <svg viewBox="0 0 640 640" width="20" height="20" style={{'marginLeft':'5px'}}>
                          <path d="M320 117.45L417.63 214.27L515.26 311.1L412.49 311.1L412.49 522.55L227.51 522.55L227.51 311.1L124.74 311.1L222.36 214.27L320 117.45Z"
                            style={{'fill':'#008000'}}/>
                        </svg>
                      }

                      

                    </div>
                  )
                })}

                {/* <div style={{ float:"left", clear: "both" }}
                    ref={(el) => { this.messagesEnd = el; }}>
                </div> */}
              </div>

            </Tab>
            <Tab eventKey={3} title={"DJ Queue (" + this.state.DJQueue.length + ")"} style={tabStyle}>
              
              <div style={messagesStyle}>
                {this.state.DJQueue.map((value, index) => {
                  return (
                    <h6 style={{ 'color': 'white', 'font-size': '100%', 'marginLeft':'5px'}}>{value}</h6>
                  )
                })}

              </div>

            </Tab>

            <Tab eventKey={4} title="Miscellaneous" style={tabStyle}>
              <div style={messagesStyle}>
                <Button onClick={() => this.showLeaderboard()} style={{'margin':'10px'}}>Leaderboard</Button>
              </div>                
              
              {/* <Leaderboard leaderboardList={this.state.leaderboardList}/> */}
              
            </Tab>

          </Tabs>
        </div>
        
        <div>
          <h6>Version Number: {this.state.currentVersion}</h6>
        </div>


        {/* Woot/Meh/Grab stuff */}
        {/* <div style={{'width': '13%', 'left': (parseInt(this.state.playerWidth.substring(0,this.state.playerWidth.length - 2)) + 7 + 'px'), 'position':'fixed', 'bottom':'0px', 'borderStyle':'solid', 'borderWidth':'5px', 'height':'60px'}}> */}
        <div style={{'width': '13%', 'right': '35%', 'position':'fixed', 'bottom':'61px', 'borderStyle':'solid', 'borderWidth':'5px', 'height':'60px'}}>
              
              <div style={{'display':'flex', 'flexWrap':'nowrap', 'alignItems': 'baseline', 'alignContent':'space-between'}}>

                {/* Woot */}
                <div style={{'width':'33%', 'margin':'10px'}}>           
                  <svg viewBox="0 0 640 640" width="40" height="40" style={{'cursor':'pointer'}} onClick={this.onClickWoot}>
                    {!this.state.wooted &&
                      <path d="M320 117.45L417.63 214.27L515.26 311.1L412.49 311.1L412.49 522.55L227.51 522.55L227.51 311.1L124.74 311.1L222.36 214.27L320 117.45Z"
                            style={{'fill':'#fff'}}/>
                    }
                    
                    {this.state.wooted &&
                      <path d="M320 117.45L417.63 214.27L515.26 311.1L412.49 311.1L412.49 522.55L227.51 522.55L227.51 311.1L124.74 311.1L222.36 214.27L320 117.45Z"
                            style={{'fill':'#008000'}}/>
                    }

                  </svg>
                  <span style={{'position':'absolute', 'bottom':'0px', 'fontWeight':'bold'}}>{this.state.wooters.length}</span>
                </div>

                {/* Meh */}
                <div style={{'width':'33%', 'margin':'10px'}}>
                  <svg viewBox="0 0 640 640" width="40" height="40" style={{'cursor':'pointer'}} onClick={this.onClickMeh}>
                    {!this.state.mehed &&
                      <path d="M515.26 328.9L417.63 425.73L320 522.55L222.36 425.73L124.74 328.9L227.51 328.9L227.51 117.45L412.49 117.45L412.49 328.9L515.26 328.9Z"
                            style={{'fill':'#fff'}}/>
                    }

                    {this.state.mehed &&
                      <path d="M515.26 328.9L417.63 425.73L320 522.55L222.36 425.73L124.74 328.9L227.51 328.9L227.51 117.45L412.49 117.45L412.49 328.9L515.26 328.9Z"
                            style={{'fill':'#ff0000'}}/>
                    }
                    
                  </svg>
                  <span style={{'position':'absolute', 'bottom':'0px', 'fontWeight':'bold'}}>{this.state.mehers.length}</span>
                </div >

                {/* Grab */}
                <div style={{'width':'33%', 'margin':'10px'}}>
                  <svg viewBox="0 0 640 640" width="40" height="40" style={{'cursor':'pointer'}} onClick={this.onClickGrab}>
                    {!this.state.grabbed &&
                      <path d="M389.25 250.79L544.09 272.19L432.05 375.98L458.49 522.55L320 453.35L181.51 522.55L207.96 375.98L95.91 272.19L250.76 250.79L320 117.45L389.25 250.79Z"
                            style={{'fill':'#fff'}}/>
                    }

                    {this.state.grabbed &&
                      <path d="M389.25 250.79L544.09 272.19L432.05 375.98L458.49 522.55L320 453.35L181.51 522.55L207.96 375.98L95.91 272.19L250.76 250.79L320 117.45L389.25 250.79Z"
                            style={{'fill':'#9400D3'}}/>
                    }
                    
                  </svg>
                  <span style={{'position':'absolute', 'bottom':'0px', 'fontWeight':'bold'}}>{this.state.grabbers.length}</span>
                </div>

              </div>
              
              
              
        </div>







        <Modal show={this.state.showAddVideoModal} onHide={this.onCloseAddVideoModal} bsSize='large'>
          <Modal.Header closeButton>
            <Modal.Title>Add Video to List</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ 'overflowY': 'auto' }}>

              <form onSubmit={(e) => this.onAddVideoSearch(e)}>
                <input value={this.state.addVideoSearchTerm} onChange={this.handleAddVideoIDChange} autoFocus/>
                <Button onClick={(e) => { this.onAddVideoSearch(e) }}>Search</Button>
              </form>

              <ListGroup>
                {this.state.searchList.map((value, index) => {
                  var imageLink = 'http://img.youtube.com/vi/' + value.videoId + '/0.jpg'

                  return (
                    <ListGroupItem onClick={() => this.onSearchListItemClicked(index)}>
                      <div style={{ 'position': 'relative' }}>
                        <img src={imageLink} style={{ 'width': '120px', 'height': '90px' }} alt={index}/>
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
        title={showVideoHistoryModal}
        isOpen={this.state.showVideoHistoryModal}
        onOutsideClick={this.onCloseVideoHistoryModal}
        
        footer={
          <div style={{'position':'fixed', 'right':'5px'}}>
            {this.state.showVideoHistoryModal &&
              <Button onClick={this.onCloseVideoHistoryModal}>Close Slider</Button>
            }
        </div> 
        }>
          
          <div>
            <ListGroup>
              {this.state.videoHistory.map((value,index) => {
                 var imageLink = 'http://img.youtube.com/vi/' + value.videoId + '/0.jpg'

                 return (
                  <ListGroupItem>
                    <div style={{ 'position': 'relative' }}>
                      <img src={imageLink} style={{ 'width': '120px', 'height': '90px' }} />
                      <h5 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px', 'wordWrap': 'break-all' }}>{value.videoTitle}</h5>
                      <p style={{ 'display': 'inline-block', 'position': 'absolute', 'right': '0px', 'top': '40%' }}>Played By: {value.user}</p>
                      
                    </div>
                  </ListGroupItem>
                )


              })}
              
            </ListGroup>
          </div>
        

          </Slider>
        

        <Slider
          title={playlistSlideInTitle}
          isOpen={this.state.showPlaylistSlideIn}
          onOutsideClick={this.closePlaylistSlideIn}
          header={
            <div style={{ 'position': 'fixed','right': '5px', 'top': '15px' }}>
                {this.state.showPlaylistSlideIn &&
                  <div>
                    <Button style={{  }} onClick={this.openAddPlaylistModal}>Add Playlist</Button>
                    <Button style={{'marginLeft':'5px'}} onClick={this.openYoutubeImportModal}>Import</Button>
                  </div>
                }
            </div>
          }
          footer={
            <div style={{'position':'fixed', 'right':'5px'}}>
              {this.state.showPlaylistSlideIn &&
                <Button onClick={this.onCloseVideoHistoryModal}>Close Slider</Button>
              }
            </div> 
            
          }>

          <div>
            <ListGroup>
              {this.state.playlists.map((value, index) => {
                var title = value.playlistTitle
                var videos = value.playlistVideos

                if (title !== '') {
                  return (
                    <ListGroupItem key={index + value} style={{ 'position': 'relative', 'display': 'flex', 'alignItems': 'center'  }} onClick={() => this.changeCurrentPlaylist(index)}>

                      <h5 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px', 'wordWrap': 'break-all' }}>{title}</h5>
                      <h6 style={{ 'display': 'inline-block', 'marginLeft': '2px' }}>({videos.length})</h6>

                      <Button
                      style= {{ 'display': 'inline-block', 'position': 'absolute', 'right': '105px' }}
                      onClick={(e) => {e.stopPropagation(); this.openRenamePlaylist(index)}}
                      >Rename</Button>

                      <Button
                        style= {{ 'display': 'inline-block', 'position': 'absolute', 'right': '55px' }}
                        onClick={(e) => {e.stopPropagation(); this.shufflePlaylist(index)}}>

                        <svg width="11" height="11" viewBox="0 0 512 512">
                          <path d="M409.434,82.96c30.04,25.7,60.08,51.42,89.971,77.29c-29.49,26.511-60.15,51.851-90.101,77.9
                            c0.07-17.43-0.11-34.851,0.061-52.271c-19,0.03-38-0.109-56.99,0.061c-9.13,0.02-17.72,4.58-23.87,11.16
                            c-54.55,56.779-109.21,113.46-163.74,170.26c-6.06,6.29-14.51,10.4-23.34,10.32c-34.689,0.22-69.39-0.17-104.069,0.229
                            c-12.891-0.38-23.95-12.06-23.94-24.89c-0.64-13.91,11.62-25.9,25.28-26.311c27.55-0.26,55.13,0.15,82.68-0.189
                            c10.05-0.061,18.9-5.92,25.24-13.32c53.72-55.939,107.5-111.83,161.25-167.75c6.04-6.59,14.72-10.65,23.68-10.85
                            c25.939-0.11,51.89,0.1,77.82-0.101C409.313,117.32,409.174,100.141,409.434,82.96z"/>
                          <path d="M32.764,134.48c37.5-0.311,75.131,0.03,112.69-0.08c9.68-0.43,19.54,3.2,26.12,10.43
                            c15.609,16.061,31.05,32.311,46.57,48.46c6.359,6.5,9.85,15.96,7.64,24.98c-2.41,11.04-12.98,19.819-24.36,19.71
                            c-7.729,0.35-14.85-3.59-20.54-8.48c-10.64-11.34-20.84-23.12-31.649-34.31c-6.19-6.3-15.09-9.41-23.83-9.29
                            c-27.99-0.12-55.98,0.08-83.971-0.09c-11.14-0.34-23.02-5.601-27.13-16.66C7.974,155.07,17.654,137.19,32.764,134.48z"/>
                          <path d="M261.554,278.17c9.67-7.729,24.83-6.609,33.36,2.32c11.689,11.98,23.13,24.21,34.83,36.18
                            c6.08,6.41,14.84,10.07,23.67,9.98c18.66-0.07,37.319,0.08,55.99-0.09c-0.19-17.11-0.07-34.221-0.04-51.33
                            c30.27,25.64,60.31,51.55,90.3,77.52c-29.95,25.95-60.061,51.71-90.221,77.41c-0.38-17.5,0.04-35.01-0.189-52.51
                            c-25.97-0.24-51.94-0.021-77.91-0.11c-8.95-0.08-17.57-4.35-23.56-10.91c-16.73-17.27-33.73-34.27-50.29-51.689
                            C247.904,304.471,250.034,286.36,261.554,278.17z"/>
                        </svg>
                      </Button>

                      <Button
                        style= {{ 'display': 'inline-block', 'position': 'absolute', 'right': '5px' }}
                        onClick={(e) => {e.stopPropagation(); if (window.confirm('Are you sure you wish to delete this item?')) this.deletePlaylist(index)}}>

                        <svg width="11" height="11" viewBox="0 0 1024 1024">
                          <path d="M192 1024h640l64-704h-768zM640 128v-128h-256v128h-320v192l64-64h768l64 64v-192h-320zM576 128h-128v-64h128v64z"></path>
                        </svg>
                      </Button>

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
                <input value={this.state.newPlaylistNameInput} onChange={this.handleNewPlaylistNameChange} autoFocus/>
                <Button onClick={(e) => { this.makeNewPlaylist(e) }}>Add</Button>
              </form>

            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeAddPlaylistModal}>Close</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.showImportYoutubeModal} onHide={this.closeYoutubeImportModal} bsSize='large'>
          <Modal.Header closeButton>
            <Modal.Title>Import Playlist from YouTube</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ 'overflowY': 'auto' }}>
              <form onSubmit={(e) => this.importPlaylistFromYoutube(e)}>
                
                  <h6 style={{'display':'inline-block'}}>Playlist Id: </h6>
                  <input value={this.state.importPlaylistId} onChange={this.handleImportPlaylistIdChange} style={{'display':'inline-block'}} autoFocus/>
                  <br/>

                  <h6 style={{'display':'inline-block'}}>New Playlist Title: </h6>
                  <input value={this.state.importPlaylistTitle} onChange={this.handleImportPlaylistTitleChange}  />
                  <br/>

                <Button type="submit">Add</Button>
              </form>

            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeYoutubeImportModal}>Close</Button>
          </Modal.Footer>
        </Modal>



        <Modal show={this.state.showGrabMenu} onHide={this.closeGrabMenu} bsSize='large'>
          <Modal.Header closeButton>
            <Modal.Title>Pick a playlist to add the video to</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ 'overflowY': 'auto' }}>
              <ListGroup>
                {this.state.playlists.map((value, index) => {
                  var title = value.playlistTitle
                  var videos = value.playlistVideos

                  if (title !== '') {
                    return (
                      <ListGroupItem key={index+value} style={{ 'position': 'relative', 'display': 'flex', 'alignItems': 'center'  }} onClick={() => this.grabToPlaylist(index)}>

                        <h5 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px', 'wordWrap': 'break-all' }}>{title}</h5>
                        <h6 style={{ 'display': 'inline-block', 'marginLeft': '2px' }}>({videos.length})</h6>

                      </ListGroupItem>
                    )
                  }

                })}
              </ListGroup>

            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeGrabMenu}>Close</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.showAdminModal} onHide={this.closeAdminModal} bsSize='large'>
          <Modal.Header closeButton>
            <Modal.Title>Admin Menu</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              <form>
                <fieldset>
                  <legend>Skip Video</legend>
                  <Button onClick={() => { this.onSkipVideo(true)}}>Skip</Button>
                </fieldset>
              </form>

              <form>
                <fieldset>
                  <legend>Toggle Chaos Skip Mode</legend>
                  <Button onClick={() => { this.adminToggleChaosSkipMode()}}>Toggle</Button>
                </fieldset>
              </form>

              <form>
                <fieldset>
                  <legend>Remove user from connected users (only use if someone's account did not properly disconnect)</legend>
                  <input value={this.state.adminRemoveUserInput} onChange={this.adminRemoveUserInputChange}  />
                  <Button onClick={() => this.adminRemoveUser()}>Toggle</Button>
                </fieldset>
              </form>

              
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeAdminModal}>Close</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.showCopyModal} onHide={this.closeCopyModal} bsSize='small'>
                <Modal.Header closeButton>
                <Modal.Title>Copy Song to Playlist</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div>
                    <ListGroup>
                      {this.state.playlists.map((playlist,index) =>{

                        return(
                          <ListGroupItem onClick={() => this.copyVideoToPlaylist(playlist, index)}>
                            <div>
                              <h5>{playlist.playlistTitle}</h5>
                              
                            </div>
                          
                          </ListGroupItem>
                        )
                        


                      })}
                      
                        

                     
                      
                    </ListGroup>
                  </div>
                </Modal.Body>

        </Modal>

        <Modal show={this.state.showRenameModal} onHide={this.closeRenameModal} bsSize='small'>
                <Modal.Header closeButton>
                  <Modal.Title>Rename Playlist</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div>
                    <form onSubmit={(e) => this.renamePlaylist(e)}>
                        <div style={{ 'position':'relative', 'left':'5px', 'marginTop':'3px', 'width':'100%', 'position':'absolute' }}>
                            <input value={this.state.renameBoxValue} onChange={this.handleRenameBoxValue}></input>
                        </div>
                    </form>

                    <Button onClick={(e) =>this.renamePlaylist(e)}>Rename</Button>
                  </div>
                </Modal.Body>
        
        </Modal>


        <Modal show={this.state.showLeaderboard} onHide={this.closeLeaderboard} bsSize='large'>
          <Modal.Header closeButton>
            <Modal.Title>Leaderboard</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              <Leaderboard leaderboardList={this.state.leaderboardList}/>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeLeaderboard}>Close</Button>
          </Modal.Footer>
        </Modal>


        <Playbar 
            ref={this.playbarRef}
            onSliderChange={this.onVolumeChange} 
            onToggleMutePlayer={this.onToggleMutePlayer} 
            getPlayerVolume={this.getPlayerVolume} 
            getPlayerIsMuted={this.getPlayerIsMuted}
            userPlayingVideo={this.state.userPlayingVideo}
            currentVideoTitle={this.state.currentVideoTitle}
            playerWidth={this.state.playerWidth}
            player={this.state.player}/>

      </div>
    );
  }
}

export default App;
