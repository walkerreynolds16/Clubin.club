from flask import Flask, request, jsonify, json
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from flask_socketio import SocketIO, send, emit
import eventlet
eventlet.monkey_patch()

import isodate
import json
import requests
import datetime
import threading

youtubeAPIKey = 'AIzaSyD7edp0KrX7oft2f-zL2uEnQFhW4Uj5OvE'
isSomeoneDJing = False

currentDJ = ''

clients = []
djQueue = []

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


@app.route('/addVideoToPlaylist', methods=['POST'])
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
        result = collection.insert_one({'username': username, 'playlists': [
                                       {'playlistTitle': playlistTitle, 'playlistVideos': []}]})

    # # Try to find a document that has the requested username
    result = collection.update_one(
        {'$and': [{'playlists.playlistTitle': playlistTitle},
                  {'username': username}]},
        {'$push': {'playlists.$.playlistVideos': newVideo}},
        upsert=True)

    return JSONEncoder().encode(result.raw_result)


@app.route('/setPlaylist', methods=['POST'])
def setPlaylist():

    playlistVideos = request.json['playlistVideos']
    playlistTitle = request.json['playlistTitle']
    username = request.json['username']

    # Connect to database and get instance of the DB
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    # Get instance of the playlist collection
    collection = db['playlists']

    doesPlaylistExist = collection.find_one(
        {'$and': [{'playlists.playlistTitle': playlistTitle}, {'username': username}]})
    print(doesPlaylistExist)
    result = None

    if(doesPlaylistExist == None):
        newPlaylist = {'playlistTitle': playlistTitle,
                       'playlistVideos': playlistVideos}
        result = collection.update_one(
            {'username': username},
            {'$push': {'playlists': newPlaylist}})

    else:
        result = collection.update_one(
            {'$and': [{'playlists.playlistTitle': playlistTitle},
                      {'username': username}]},
            {'$set': {'playlists.$.playlistVideos': playlistVideos}},
            upsert=True)

    return JSONEncoder().encode(result.raw_result)


@app.route('/deleteVideoInPlaylist', methods=['POST'])
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
        {'$and': [{'playlists.playlistTitle': playlistTitle},
                  {'username': username}]},
        {'$pull': {'playlists.$.playlistVideos': video}},
        upsert=False)

    return JSONEncoder().encode(result.raw_result)


@app.route('/setCurrentPlaylist', methods=['POST'])
def setCurrentPlaylist():
    playlist = request.json['newCurrentPlaylist']
    username = request.json['username']

    print(playlist)

    # Connect to database and get instance of the DB
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    # Get instance of the playlist collection
    collection = db['playlists']

    currentPlaylist = collection.find_one({'username': username})

    if(currentPlaylist != None):
        res = collection.update_one(
            {'username': username},
            {'$set': {'currentPlaylist': playlist}})

        return JSONEncoder().encode(res.raw_result)
    else:
        return ('user does not exist')


@app.route('/login', methods=['POST'])
def login():
    username = request.json['username']
    password = request.json['password']

    # Connect to database and get instance of the DB
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    # Get instance of the playlist collection
    collection = db['accounts']

    doesUsernameExist = collection.find_one({'username': username})
    print(JSONEncoder().encode(doesUsernameExist))

    # The username does not exist
    if(doesUsernameExist == None):
        result = collection.insert_one(
            {'username': username, 'password': password})
        return 'success'

    else:
        if(doesUsernameExist['password'] == password):
            print("***** Right Password ******")
            return 'success'
        else:
            print("***** Wrong Password ******")
            return 'failure'










@socketio.on('connected')
def handleConnection(user):
    clients.append({'user': user, 'clientId': request.sid})
    send(user, broadcast=True)


@socketio.on('Event_joinDJ')
def handleJoinDJ(data):
    print(json.dumps(data))

    global isSomeoneDJing
    global currentDJ

    user = data['user']

    djQueue.append(user)

    print(user + ' has joined the dj queue')
    print(djQueue)
    print('\n')

    if(isSomeoneDJing == False):
        nextDJ = djQueue.pop(0)
        currentDJ = nextDJ
        print('CurrentDJ in handle join dj = ' + currentDJ)
        sendNewVideoToClients(nextDJ)
        isSomeoneDJing = True
        # djQueue.append(nextDJ)


@socketio.on('Event_sendChatMessage')
def handleChatMessage(data):
    user = data['user']
    message = data['message']

    emit('Event_receiveChatMessage', {
         'user': user, 'message': message}, broadcast=True)


@socketio.on('Event_leaveDJ')
def handleLeavingDJ(data):
    print(json.dumps(data))

    global currentDJ

    user = data['user']
    print(user)

    if(user == currentDJ):
        currentDJ = ''
    else:
        djQueue.remove(user)

    global isSomeoneDJing

    if(len(djQueue) == 0):
        isSomeoneDJing = False

@socketio.on('Event_skipCurrentVideo')
def handleSkipRequest(data):
    # for now, i guess just determine the next video
    # TODO count the amount of skip requests and only skip when the majority of people want to skip

    determineNextVideo()


def sendNewVideoToClients(nextUser):
    # Get next video from next DJ
    user = None
    for item in clients:
        if(item['user'] == nextUser):
            user = item

    currentPlaylist = None

    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    collection = db['playlists']

    playlist = collection.find_one({'username': nextUser})['currentPlaylist']

    if(playlist != None):
        if(len(playlist['playlistVideos']) != 0):
            nextVideo = playlist['playlistVideos'].pop(0)
        else:
            print('Next User doesn\'t have videos in their current playlist. Next User = ' + nextUser)
            determineNextVideo()
            return
    else:
        print('Next User doesn\'t exists. Next User = ' + nextUser)
        determineNextVideo()
        return


    data = {'videoId': nextVideo['videoId'], 'videoTitle': nextVideo['videoTitle'], 'username': nextUser}

    print('\n ****************** \n')

    print("Username = " + str(data['username']))
    print("Video Id = " + str(data['videoId']))
    print("Video Title = " + str(data['videoTitle']))
    global currentDJ
    print("Current DJ = " + str(currentDJ))

    print('\n ****************** \n')


    
    print('\n emitting to clients \n')
    socketio.emit('Event_nextVideo', data, broadcast=True)

    duration = getVideoDuration(data['videoId'])
    videoTimer = threading.Timer(duration + 4.0, determineNextVideo)
    videoTimer.start()

    playlist['playlistVideos'].append(nextVideo)

    collection.update_one({'username': nextUser}, {'$set': {'currentPlaylist': playlist}})
    return None


def determineNextVideo():
    # print('timer done ***************')
    global currentDJ

    print('Current DJ in determineVideo = ' + currentDJ)
    if(currentDJ != ''):
        djQueue.append(currentDJ)

    print(djQueue)

    if(len(djQueue) != 0):
        nextUser = djQueue.pop(0)
        currentUser = nextUser
        sendNewVideoToClients(nextUser)
        djQueue.append(nextUser)
    else:
        print('No more DJs in queue')


def getVideoDuration(videoId):
    url = 'https://www.googleapis.com/youtube/v3/videos?key=' + youtubeAPIKey + '&id=' + str(videoId) + '&part=contentDetails'
    r = requests.get(url)
    res = json.loads(r.text)
    duration = res['items'][0]['contentDetails']['duration']

    duration = isodate.parse_duration(duration).total_seconds()
    return duration




class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)


if __name__ == '__main__':
    socketio.run(app, debug=True)
