import React, { Component } from 'react'
import App from './App'
import Login from './Login'
import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";

export default class Home extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loggedIn: false,
      username: '',
    }
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

            <Route path='/home' render={
              (props) => this.state.loggedIn ? <App {...props} loginUsername={this.state.username} /> : (<Redirect to="/" />)
            }
            />


            <Route exact path='/' render={
              (props) => this.state.loggedIn ? (<Redirect to="/home" />) : (<Login {...props} changeUsername={this.changeUsername} changeLoggedIn={this.changeLoggedIn} />)
            } />

          </div>

        </Router>

      </div>
    )
  }
}