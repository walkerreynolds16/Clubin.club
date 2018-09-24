import React, { Component } from 'react';
import YouTube from 'react-youtube';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';
// import Modal from 'react-modal';
import { TextField, validator } from 'react-textfield';
import {Button, FormGroup, FormControl, ListGroup, ListGroupItem, Modal} from 'react-bootstrap';
import Axios from 'axios'
import '../Styles/App.css';

var video = 'iUzAylE7MBY'
const youtubeAPIKey = 'AIzaSyD7edp0KrX7oft2f-zL2uEnQFhW4Uj5OvE'

const listStyle = {
  display:'inline-block',
  position:'fixed',
  width:'30%',
  top:'5px',
  left:'5px'
}

const playerStyle = {
  display:'inline',
  position:'relative',
  left:'30%',
  marginLeft:'20px',
  top:'5px'
}

const SortableItem = SortableElement(({value}) => {
  var image = 'http://img.youtube.com/vi/' + value.id + '/0.jpg'

  return (
    <div>
      <li style={{'listStyle':'none', 'display':'flex','alignItems':'center','marginBottom':'15px'}}>
        <img src={image} style={{'width':'120px','height':'90px'}}/>
        <h5 style={{'display':'inline-block','fontWeight':'bold', 'marginLeft':'5px'}}>{value.title}</h5>
      </li>
    </div>
    
  );
});

const SortableList = SortableContainer(({items}) => {
  return (
    <ul>
      {items.map((value, index) => (
        <SortableItem key={`item-${index}`} index={index} value={value} />
      ))}
    </ul>
  );
});


class App extends Component {

  constructor(props){
    super(props)

    this.state = {
      listItems: [
        {id:'iUzAylE7MBY',title:'Get SWATTED! - Demo Disk Gameplay'},
        {id:'UyMGTYb6pew',title:'GRAB MY WOOD - Demo Disk Gameplay'},
        {id:'jwGEuO3RucA',title:'HITLER IS ALIVE?!? - Demo Disk Gameplay'},
        {id:'8EbxFdQFCfk',title:'WORST RESTAURANT EVER - Demo Disk Gameplay'}
      ],
      showAddVideoModal: false,
      addVideoSearchTerm: '',
      playerWidth: '',
      playerHeight: '',
      searchList: []

    }
  }

  updatePage = () => {
    console.log('updating')
    this.forceUpdate()
  }

  componentDidMount() {
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    var width = window.innerWidth * .65
    var height = width * (9/16)

    this.setState({
      playerWidth: (width) + 'px',
      playerHeight: (height) + 'px',
    })
  }

  onSortEnd = ({oldIndex, newIndex}) => {
    this.setState({
      listItems: arrayMove(this.state.listItems, oldIndex, newIndex),
    });
  };

  onReady(event) {
    // access to player in all event handlers via event.target
    event.target.pause
  }

  onPlayerStateChange = (event) => {
    if(event.data === 0){
      this.skipCurrentVideo()
    }
  }

  skipCurrentVideo = () => {
    console.log('skipping')
    var topItem = this.state.listItems.splice(0,1)
    var listCopy = this.state.listItems.slice()

    
    listCopy.push(topItem[0])
    video = listCopy[0].id

    this.setState({
      listItems: listCopy
    })

    this.forceUpdate()
  }

  onAddVideo = () => {
    console.log('add new video')
    this.onShowAddVideoModal()
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

  handleAddVideoIDChange= (event) => {
    this.setState({
      addVideoSearchTerm: event.target.value
    })
  }

  onAddVideoSearch = (e) => {
    if(e != undefined){
      e.preventDefault(); 
    }
    
    var q = this.state.addVideoSearchTerm
    var maxResults = 25
    var url = 'https://www.googleapis.com/youtube/v3/search?q=' + q + '&key=' + youtubeAPIKey + '&maxResults=' + maxResults + '&part=snippet'
    
    if(q.length >= 1){
      Axios.get(url)
        .then(response => {
          console.log(response)

          var results = response['data']['items']
          var searchList = []

          for(var i = 0; i < results.length; i++){
            var item = results[i]

            var videoId = item['id']['videoId']
            var videoTitle = item['snippet']['title']

            if(videoId !== undefined){
              //add videos to a list to be displayed on the modal
              searchList.push({id:videoId, title:videoTitle})
              
            }

          }

          this.setState({
            searchList: searchList
          })

        })
    }

  }

  onSearchListItemClicked = (index) => {
    console.log('Index = ' + index)

    var list = this.state.listItems.slice()
    var searchRes = this.state.searchList.slice()

    list.push(searchRes[index])

    this.setState({
      listItems: list
    })

    this.forceUpdate()
  }

  handleKeyPress = (event) =>{
    event.preventDefault()
    console.log(event.key)
    
    if(event.key == 'Enter'){
      this.onAddVideoSearch()
    }
    
  }

  testBackendCall = () => {
    var url = 'http://localhost:5000/hello?name=Walker'
    Axios.get(url)
      .then(response => {
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

        <Button onClick={this.testBackendCall}>Test</Button>
        
        <div style={listStyle}>
          <fieldset style={{'border':'p2'}}>
            <Button onClick={this.onAddVideo}>Add Video</Button>

            <div style={{'marginTop':'10px'}}>
              <SortableList 
                items={this.state.listItems} 
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
            onStateChange={this.onPlayerStateChange}/>

          <Button bsSize='large' onClick={() => this.skipCurrentVideo()}>></Button>
        </div>


        <Modal show={this.state.showAddVideoModal} onHide={this.onCloseAddVideoModal} bsSize='large'>
          <Modal.Header closeButton>
            <Modal.Title>Add Video to List</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <div style={{'overflowY':'auto'}}>
              <form>
                <input value={this.state.addVideoSearchTerm} onChange={this.handleAddVideoIDChange}/>
                <Button onClick={(e) => {this.onAddVideoSearch(e)}}>Search</Button>
              </form>

              <ListGroup>
                {this.state.searchList.map((value, index) => {
                  var imageLink = 'http://img.youtube.com/vi/' + value.id + '/0.jpg'

                  return(
                    <ListGroupItem style={{'position':'relative'}} onClick={() => this.onSearchListItemClicked(index)}>
                      <img src={imageLink} style={{'width':'120px','height':'90px'}}/>
                      <h5 style={{'display':'inline-block','fontWeight':'bold', 'marginLeft':'5px', 'wordWrap':'break-all'}}>{value.title}</h5>
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

      </div>
    );
  }
}

export default App;
