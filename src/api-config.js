let backendHost;

const hostname = window.location.href

if(hostname.includes('localhost')) {
  backendHost = 'http://127.0.0.1:5000';
} else{
  backendHost = 'https://plug-dj-clone-api.herokuapp.com'
}

export const API_ENDPOINT = backendHost;