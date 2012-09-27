#!/usr/bin/env node
/*jslint indent: 2, node: true */

"use strict";

var util = require('util');
var fs = require('fs');
var TwitterStream = require('./lib/twitter-stream');

var express = require('express')
  , routes = require('./routes')
  , wall = require('./routes/wall')
  , http = require('http')
  , path = require('path')
  , socket_io = require('socket.io');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/wall', wall.index);

var server = require('http').createServer(app);
var io = socket_io.listen(server);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

io.sockets.on('connection', function (socket) {
  // socket.emit('news', { hello: 'world' });
  // socket.on('wat', function (data) {
  //   console.log(data);
  // });
});

var wall = null;
var animationHandle = null;

if (true) {
  var Canvas = require('openvg-canvas');
  var canvas = new Canvas(1920, 1080);
  var Painter = require('./lib/tweet-painter').Painter;
  var ImageManager = require('./lib/image-manager');
  var Encoder = require('node-html-encoder').Encoder;
  var encoder = new Encoder('entity');

  wall = new Painter(canvas, {
      imageManager: new ImageManager(),
      htmlUnencode: function (text) {
        return encoder.htmlDecode(text);
      }
    });
  (function animloop(time) {
    animationHandle = requestAnimationFrame(animloop);
    wall.paint(time);
  })();
}

function logTweet(emitter) {
  return function (tweet) {
    console.log(tweet.text);
    emitter(tweet);
  }
}

function addToWall(emitter) {
  return function (tweet) {
    wall.addToQueue(tweet);
    emitter(tweet);
  }
}

function sendTweet(emitter) {
  return function (tweet) {
    io.sockets.emit('tweet', tweet);
    emitter(tweet);
  }
}

fs.readFile('config.json', function (err, data) {
  if (err) {
    console.log('Can\'t read config file.');
    console.log('Error: ' + err);
    return;
  }

  var emitter = function (tweet) {};
  emitter = sendTweet(emitter);
  if (wall !== null) { emitter = addToWall(emitter); }
  emitter = logTweet(emitter);

  console.log('Passing data to TwitterStream');
  TwitterStream.streamTweets(JSON.parse(data), emitter);
});

