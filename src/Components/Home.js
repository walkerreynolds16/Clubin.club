import React, { Component } from 'react'
import App from './App'
import Login from './Login'
import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";
import Axios from 'axios'
import packageJson from '../../package.json'

// const apiEndpoint = 'http://127.0.0.1:5000'
const apiEndpoint = 'https://plug-dj-clone-api.herokuapp.com'

export default class Home extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loggedIn: false,
      username: '',
      frontEndVersion: packageJson.projectVersion,
      backEndVersion: '',
      disableLoginButton: false
    }
  }

  componentDidMount(){
    console.log(this.state.frontEndVersion)
    this.checkVersion()
  }

  checkVersion = () => {
    var url = apiEndpoint + '/getCurrentVersion'
    

    Axios.get(url)
      .then((response) => {  
        console.log(response)      
        var currentVersion = response['data']['version']

        this.setState({
          backEndVersion: currentVersion
        })

        if(currentVersion !== this.state.frontEndVersion){
          this.setState({
            disableLoginButton: true
          })
        }
        
      })


  }

  changeUsername = (val) => {
    this.setState({
      username: val
    })
  }

  changeLoggedIn = (val) => {
    this.setState({
      loggedIn: val
    })
  }


  render() {

    return (
      <div>
        <Router>
          <div>

            {/* <Route path='/home' render={
              (props) => this.state.loggedIn ? <App {...props} loginUsername={this.state.username} /> : (<Redirect to="/" />)
            }
            /> */}


            <Route exact path='/' render={
              (props) => this.state.loggedIn ? (<App {...props} loginUsername={this.state.username} />) : (<Login {...props} 
                                                                                    changeUsername={this.changeUsername} 
                                                                                    changeLoggedIn={this.changeLoggedIn} 
                                                                                    disableLoginButton={this.state.disableLoginButton} 
                                                                                    backEndVersion={this.state.backEndVersion}/>)
            } />

          </div>

        </Router>

      </div>
    )
  }
}