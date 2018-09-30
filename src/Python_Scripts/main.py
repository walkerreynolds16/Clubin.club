from flask import Flask, url_for, request, jsonify, json
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import json

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)


app = Flask(__name__)
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
    
    # Connect to database and get instance of the DB
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    # Get instance of the playlist collection
    collection = db['playlists']

    newVideo = {'videoId': videoId, 'videoTitle': videoTitle}

    print(videoTitle)
    
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


if __name__ == '__main__':
    app.run(debug=True)