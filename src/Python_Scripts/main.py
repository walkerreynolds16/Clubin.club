from flask import Flask, url_for, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

@app.route('/')
def api_root():
    return 'Welcome'

@app.route('/articles')
def api_articles():
    return 'List of ' + url_for('api_articles')

@app.route('/articles/<articleid>')
def api_article(articleid):
    return 'You are reading ' + articleid

@app.route('/hello')
def api_hello():
    if 'name' in request.args:
        return 'Hello ' + request.args['name']
    else:
        return 'Hello John Doe'

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


    


if __name__ == '__main__':
    app.run(debug=True)