/*jslint indent: 2 */

var TwitterStream = module.exports;

"use strict";

var Twitter = require('ntwitter');

streamTweets = TwitterStream.streamTweets = function (config, callback) {
  var twit = new Twitter(config.auth);

  twit.stream('statuses/filter', config.filter, function (stream) {
    stream.on('data', function (data) {
      // console.log(data);
      callback(data);
    });
    stream.on('error', function (error, status) {
      console.log('ERROR');
      console.log('=====');
      console.log(error + ' ----- ' + status);
    });
  });
}
