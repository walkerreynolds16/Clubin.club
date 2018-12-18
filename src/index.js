import React from 'react';
import ReactDOM from 'react-dom';
import './Styles/index.css';
import Home from './Components/Home'
import { BrowserRouter as Router } from "react-router-dom";
import registerServiceWorker from './registerServiceWorker';

/* global soundManager:false */
import 'react-sound';
soundManager.setup({debugMode: false});



ReactDOM.render(

    <Router>
        <Home />
    </Router>
,
document.getElementById('root'));


registerServiceWorker();
