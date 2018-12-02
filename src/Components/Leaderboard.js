import React, { Component } from 'react'
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table'
// import 'node_modules/react-bootstrap-table/dist/react-bootstrap-table-all.min.css';
import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css'


export default class Leaderboard extends Component {
  constructor(props) {
    super(props)

    this.state = {

    }
  }

  componentDidMount() {    
    // this.waitForVolume()
    // this.waitForIsMuted()
    
  }

  sortValue = (a, b, order) => {
    if (order === 'desc') {
        return a - b;
      } else {
        return b - a;
      }
  }

  render() {

    return (
      <div>
        <BootstrapTable data={this.props.leaderboardList}>

          <TableHeaderColumn dataField='username' isKey >Username</TableHeaderColumn>

          <TableHeaderColumn dataField='woots' dataSort >Woots</TableHeaderColumn>

          <TableHeaderColumn dataField='mehs' dataSort >Mehs</TableHeaderColumn>

          <TableHeaderColumn dataField='grabs' dataSort >Grabs</TableHeaderColumn>

        </BootstrapTable>
      </div>
    )
  }
}