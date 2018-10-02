import React from 'react';
import ReactDOM from 'react-dom';
import './Styles/index.css';
import App from './Components/App';
import Login from './Components/Login'
import { BrowserRouter as Router } from "react-router-dom";
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(

<Router>
    <App />
</Router>,
document.getElementById('root'));


registerServiceWorker();
