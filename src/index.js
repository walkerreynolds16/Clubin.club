import React from 'react';
import ReactDOM from 'react-dom';
import './Styles/index.css';
import Home from './Components/Home'
import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";
import registerServiceWorker from './registerServiceWorker';



ReactDOM.render(

    <Router>
        <Home />

    </Router>
,
document.getElementById('root'));


registerServiceWorker();
