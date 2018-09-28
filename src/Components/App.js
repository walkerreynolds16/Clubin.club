import React, { Component } from 'react';
import YouTube from 'react-youtube';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { Button, ListGroup, ListGroupItem, Modal } from 'react-bootstrap';
import Slider from 'react-slide-out'
import Axios from 'axios'
import '../Styles/App.css';
import 'react-slide-out/lib/index.css'

var video = 'iUzAylE7MBY'
const youtubeAPIKey = 'AIzaSyD7edp0KrX7oft2f-zL2uEnQFhW4Uj5OvE'
const apiEndpoint = 'http://localhost:5000'

const listStyle = {
  display: 'inline-block',
  position: 'fixed',
  width: '25%',
  top: '5px',
  left: '5px'
}

const playerStyle = {
  display: 'inline',
  position: 'relative',
  left: '25%',
  marginLeft: '20px',
  top: '5px'
}

const SortableItem = SortableElement(({ value }) => {
  var image = 'http://img.youtube.com/vi/' + value.videoId + '/0.jpg'

  return (
    <div>
      <li style={{ 'listStyle': 'none', 'display': 'flex', 'alignItems': 'center', 'marginBottom': '15px' }}>
        <img src={image} style={{ 'width': '60px', 'height': '45px' }} />
        <h6 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px' }}>{value.videoTitle}</h6>
      </li>
    </div>

  );
});

const SortableList = SortableContainer(({ items }) => {
  return (
    <div style={{'overflow':'auto', 'height':'600px'}}>
      <ul>
        {items.map((value, index) => (
          <SortableItem key={`item-${index}`} index={index} value={value} />
        ))}
      </ul>
    </div>
    
  );
});


class App extends Component {

  constructor(props) {
    super(props)

    this.state = {
      currentPlaylist: {playlistTitle: '', playlistVideos: []},
      showAddVideoModal: false,
      addVideoSearchTerm: '',
      playerWidth: '',
      playerHeight: '',
      searchList: [],
      currentUser: 'walker',
      showPlaylistSlideIn: false,
      playlists: [
        {playlistTitle: 'Memes', playlistVideos: []}
      ]

    }
  }


  componentDidMount() {
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions);

    this.getPlaylistsForCurrentUser()

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
  }

  // This function is called when the sortable list is sorted
  onSortEnd = ({ oldIndex, newIndex }) => {
    var newCurrentPlaylist =  {playlistTitle: this.state.currentPlaylist.playlistTitle , playlistVideos: arrayMove(this.state.currentPlaylist.playlistVideos, oldIndex, newIndex)}

    this.setState({
      currentPlaylist: newCurrentPlaylist,
    });

    this.setBackEndPlaylist(newCurrentPlaylist.playlistVideos)

  };

  onReady(event) {
    // access to player in all event handlers via event.target
    event.target.pause
  }

  onPlayerStateChange = (event) => {
    if (event.data === 0) {
      this.skipCurrentVideo()
    }
  }

  skipCurrentVideo = () => {
    console.log('skipping')
    var topItem = this.state.currentPlaylist.playlistVideos.splice(0, 1)
    var listCopy = this.state.currentPlaylist.playlistVideos.slice()


    listCopy.push(topItem[0])
    video = listCopy[0].videoId

    var newPlaylist = {playlistTitle: this.state.currentPlaylist.playlistTitle, playlistVideos: listCopy}

    this.updatePlaylistState(newPlaylist)


    this.setState({
      currentPlaylist: newPlaylist
    })

    this.forceUpdate()
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
      Axios.get(url)
        .then(response => {
          console.log(response)

          var results = response['data']['items']
          var searchList = []

          for (var i = 0; i < results.length; i++) {
            var item = results[i]

            var videoId = item['id']['videoId']
            var videoTitle = item['snippet']['title']

            if (videoId !== undefined) {
              //add videos to a list to be displayed on the modal
              searchList.push({ videoId: videoId, videoTitle: videoTitle })

            }

          }

          this.setState({
            searchList: searchList
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
    var newPlaylist = {playlistTitle: this.state.currentPlaylist.playlistTitle, playlistVideos: list}
    
    this.updatePlaylistState(newPlaylist)

    this.setState({
      currentPlaylist: newPlaylist
    })

    this.forceUpdate()

    //Update backend for new video
    this.addVideoToPlaylist(searchRes[index])

    
  }

  //This function is used to update the playlists state with an updated playlist
  //Finds the playlist with the same name as the new playlist and replaces it
  updatePlaylistState = (newPlaylist) => {
    //Make a copy of all the playlists
    var playlistsCopy = this.state.playlists.slice()

    //Find the playlist that was just changed in the copy
    //Switch the old playlist with the new one
    for(var i = 0; i < playlistsCopy.length; i++){
      if(playlistsCopy[i].playlistTitle === newPlaylist.playlistTitle){
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
        console.log(response)
      })

  }

  getVideoTitle = (videoId) => {
    var url = 'https://www.googleapis.com/youtube/v3/videos?key=' + youtubeAPIKey + '&id='+ videoId +'&part=snippet'
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
    
    var currentPlaylistVideos = playlists['playlists'][0]['playlistVideos']
    var videoList = []

    for(const item of currentPlaylistVideos){
      var videoId = item['videoId']
      var videoTitle = item['videoTitle']

      var obj = {videoId: videoId, videoTitle: videoTitle}

      videoList.push(obj)

    }

    var newPlaylist = {playlistTitle: this.state.currentPlaylist.playlistTitle, playlistVideos: videoList}

    this.setState({
      currentPlaylist: newPlaylist
    })

    video = videoList[0]['videoId']

    this.forceUpdate()


  }

  //This function is usually called after sorting a playlist
  //The function takes the current playlist and sends it to the backend to be put in the db
  setBackEndPlaylist = (newList) => {
    var data = {
      username: this.state.currentUser,
      playlist: newList
    }

    Axios.defaults.headers.post['Content-Type'] = 'application/json'

    var url = apiEndpoint + '/setPlaylist'

    Axios.post(url, data)
      .then((response) => {
        console.log(response)
      })

  }

  getPlaylistsForCurrentUser = () => {
    var url = apiEndpoint + '/getPlaylists?username=' + this.state.currentUser
    Axios.get(url)
      .then((response) => {
        console.log(response)

        if (response.data.length !== 0) {
          this.setFrontEndPlaylist(response.data)

          this.setState({
            playlists: response.data.playlists,
            currentPlaylist: response.data.playlists[0]
          })

        } else {
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

    if(newPlaylist.playlistTitle === this.state.currentPlaylist.playlistTitle){
      alert("The selected playlist is already the current playlist")
    }else {

      this.setState({
        currentPlaylist: newPlaylist
      })

      this.forceUpdate()
    }


  }

  testButton = () => {
    var url = apiEndpoint + '/getPlaylists?username=' + this.state.currentUser
    Axios.get(url)
      .then((response) => {
        console.log(response)
      })
  }

  render() {

    const opts = {
      width: this.state.playerWidth,
      height: this.state.playerHeight,
      playerVars: { // https://developers.google.com/youtube/player_parameters
        autoplay: 0,
        controls: 1
      }
    };

    return (
      <div >

        <div style={listStyle}>
          <fieldset style={{ 'border': 'p2' }}>
            <Button onClick={this.onShowAddVideoModal}>Add Video</Button>
            <Button style={{'marginLeft':'5px'}} onClick={this.openPlaylistSlideIn}>Playlists</Button>
            <Button style={{'marginLeft':'5px'}} onClick={() => this.skipCurrentVideo()}>Skip Video</Button>

            <Button style={{'marginLeft':'10px'}} onClick={this.openPlaylistSlideIn}>Test</Button>

            

            <div style={{ 'marginTop': '10px' }}>
              <SortableList
                items={this.state.currentPlaylist.playlistVideos}
                onSortEnd={this.onSortEnd}
                distance={5} />
            </div>


          </fieldset>
        </div>

        <div style={playerStyle}>
          <YouTube
            videoId={video}
            opts={opts}
            onReady={this.onReady}
            onStateChange={this.onPlayerStateChange} />

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
                    <ListGroupItem style={{ 'position': 'relative' }} onClick={() => this.onSearchListItemClicked(index)}>
                      <img src={imageLink} style={{ 'width': '120px', 'height': '90px' }} />
                      <h5 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px', 'wordWrap': 'break-all' }}>{value.videoTitle}</h5>
                      {/* <Button bsSize="large" style={{'position':'fixed', 'right':'5px', 'top':'20px'}} onClick={() => this.onSearchListItemClicked(index)}>+</Button> */}
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
          title='Playlists'
          isOpen={this.state.showPlaylistSlideIn}
          onOutsideClick={this.closePlaylistSlideIn}
          header={
            <div style={{'position':'fixed'}}>
              <Button style={{'right':'5px'}} onClick={this.showAddPlaylistModal}>Add Playlist</Button>
            </div>
          }>
          
          <div>
            <ListGroup>
              {this.state.playlists.map((value, index) => {
                var title = value.playlistTitle
                var videos = value.playlistVideos

                return (
                  <ListGroupItem style={{ 'position': 'relative' }} onClick={() => this.changeCurrentPlaylist(index)}>
                    <h5 style={{ 'display': 'inline-block', 'fontWeight': 'bold', 'marginLeft': '5px', 'wordWrap': 'break-all' }}>{title}</h5>
                    <h6 style={{'display':'inline-block', 'marginLeft':'2px'}}>({videos.length})</h6>
                  </ListGroupItem>
                )
              })}
            </ListGroup>
          </div>

        </Slider>

      </div>
    );
  }
}

export default App;
