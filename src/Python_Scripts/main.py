from flask import Flask, url_for, request, jsonify, json, render_template
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from flask_socketio import SocketIO, send, emit

import isodate
import json
import requests
import datetime

youtubeAPIKey = 'AIzaSyD7edp0KrX7oft2f-zL2uEnQFhW4Uj5OvE'


videoQueue = []

app = Flask(__name__)
app.config['SECRET_KEY'] = 'onesouth'
socketio = SocketIO(app)
CORS(app)

@app.route('/getPlaylists')
def getPlaylists():
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    collection = db['playlists']
    
    playlist = collection.find_one({'username': request.args['username']})

    if(playlist != None):
        return JSONEncoder().encode(playlist)
    else:
        return JSONEncoder().encode([])


@app.route('/addVideoToPlaylist', methods = ['POST'])
def addVideoToPlaylist():

    username = request.json['username']
    playlistTitle = request.json['playlistTitle']
    videoId = request.json['videoId']
    videoTitle = request.json['videoTitle']

    # If the user that just added a video doesn't have an entry in the playlist db, change the playlist title to default
    if(playlistTitle is ''):
        playlistTitle = 'default'
    
    # Connect to database and get instance of the DB
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    # Get instance of the playlist collection
    collection = db['playlists']

    newVideo = {'videoId': videoId, 'videoTitle': videoTitle}

    # print(videoTitle)

    doesUserExist = collection.find_one({'username': username})

    # If the user doesn't exist in the playlists db, make a new entry for them
    if(not doesUserExist):
        result = collection.insert_one({'username': username, 'playlists': [{'playlistTitle': playlistTitle, 'playlistVideos': []}]})

    
    # # Try to find a document that has the requested username
    result = collection.update_one(
        {'$and': [{'playlists.playlistTitle': playlistTitle}, {'username': username}]},
        {'$push': {'playlists.$.playlistVideos': newVideo}},
         upsert=True)


    return JSONEncoder().encode(result.raw_result)    


@app.route('/setPlaylist', methods = ['POST'])
def setPlaylist():

    playlistVideos = request.json['playlistVideos']
    playlistTitle = request.json['playlistTitle']
    username = request.json['username']


    # Connect to database and get instance of the DB
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    # Get instance of the playlist collection
    collection = db['playlists']

    doesPlaylistExist = collection.find_one({'$and': [{'playlists.playlistTitle': playlistTitle}, {'username': username}]})
    print(doesPlaylistExist)
    result = None

    if(doesPlaylistExist == None):
        newPlaylist = {'playlistTitle': playlistTitle, 'playlistVideos': playlistVideos}
        result = collection.update_one(
            {'username': username},
            {'$push': {'playlists': newPlaylist}})

    else:
        result = collection.update_one(
            {'$and': [{'playlists.playlistTitle': playlistTitle}, {'username': username}]},
            {'$set': {'playlists.$.playlistVideos': playlistVideos}},
            upsert=True)

    

    return JSONEncoder().encode(result.raw_result)


# As of right now, this function will delete all instances of a video in a playlist
# This means if there is a duplicate video in a list, both will be deleted
# Apparently, there is no real way of only deleting one element from an array
# My new approach is to delete the video on the front end, then set the backend playlist to the front end playlist
@app.route('/deleteVideoInPlaylist', methods = ['POST'])
def deleteVideoInPlaylist():

    username = request.json['username']
    playlistTitle = request.json['playlistTitle']
    videoId = request.json['videoId']
    videoTitle = request.json['videoTitle']
    
    # Connect to database and get instance of the DB
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    # Get instance of the playlist collection
    collection = db['playlists']

    video = {'videoId': videoId, 'videoTitle': videoTitle}

    print(videoTitle)
    
    # # Try to find a document that has the requested username
    result = collection.update_one(
        {'$and': [{'playlists.playlistTitle': playlistTitle}, {'username': username}]},
        {'$pull': {'playlists.$.playlistVideos': video}},
         upsert=False)


    return JSONEncoder().encode(result.raw_result)  

@app.route('/login', methods = ['POST'])
def login():
    username = request.json['username']
    password = request.json['password']
    
    # Connect to database and get instance of the DB
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    # Get instance of the playlist collection
    collection = db['accounts']

    doesUsernameExist = collection.find_one({'username': username})

    # The username does not exist
    if(doesUsernameExist == None):
        result = collection.insert_one({'username':username, 'password': password})
        return 'success'

    else:
        if(password is doesUsernameExist.password):
            print("***** Right Password ******")
            return 'success'
        else:
            print("***** Wrong Password ******")
            return 'failure'


@socketio.on('message')
def handleMessage(msg):
    print('Message = ' + msg)
    send(msg, broadcast=True)

@socketio.on('Event_joinDJ')
def handleCustomEvent(data):
    print(json.dumps(data))

    user = data['user']
    nextVideo = data['nextVideo']

    videoQueue.append({'user': user, 'nextVideo': nextVideo})

    # print(json.dumps(videoQueue.pop))
    video = videoQueue.pop()
    getVideoDuration(video['nextVideo']['videoId'])
    emit('Event_videoFromServer', video, broadcast=True)

def getVideoDuration(videoId):
    url = 'https://www.googleapis.com/youtube/v3/videos?key=' + youtubeAPIKey +'&id=' + str(videoId) + '&part=contentDetails'
    r = requests.get(url)
    res = json.loads(r.text)
    duration = res['items'][0]['contentDetails']['duration']

    duration = isodate.parse_duration(duration).total_seconds()
    print((duration))


class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)
    

if __name__ == '__main__':
    socketio.run(app, debug=True)