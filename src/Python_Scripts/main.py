from flask import Flask, url_for, request, jsonify, json
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

@app.route('/getPlaylist')
def getPlaylist():
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    collection = db['playlists']
    
    playlist = collection.find_one({'username': request.args['username']})

    if(playlist != None):
        return jsonify(playlist['playlist'])
    else:
        return jsonify([])

@app.route('/addVideoToPlaylist')
def addVideoToPlaylist():
    # Connect to database and get instance of the DB
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    # Get instance of the playlist collection
    collection = db['playlists']

    newVideo = {'videoId':request.args['videoId'], 'videoTitle': request.args['videoTitle']}
    
    # Try to find a document that has the requested username
    result = collection.update_one({'username': request.args['username']}, {'$push': {'playlist': newVideo}}, upsert=False)

@app.route('/setPlaylist', methods = ['POST'])
def setPlaylist():

    playlist = request.json['playlist']
    username = request.json['username']

    # Connect to database and get instance of the DB
    client = MongoClient("localhost:27017")
    db = client.PlugDJClone

    # Get instance of the playlist collection
    collection = db['playlists']

    newPlaylist = []

    for item in playlist:
        newObj = {'videoId': item['id'], 'videoTitle': item['title']}
        newPlaylist.append(newObj)

    result = collection.update_one({'username': username}, {'$set': {'playlist': newPlaylist}}, upsert=False)

    return json.dumps(result.raw_result)

    


if __name__ == '__main__':
    app.run(debug=True)