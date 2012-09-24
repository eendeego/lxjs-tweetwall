/*jslint indent: 2 */

"use strict";

// http://caolanmcmahon.com/posts/writing_for_node_and_the_browser
(function (exports) {
  var AVATAR_SIZE = 48;

  var AVATAR_MARGIN = { top: 10, right: 10, bottom: 10, left: 10};
  var USER_MARGIN = { top: 10, right: 10, bottom: 4, left: 10};
  var TIME_MARGIN = { top: 10, right: 10, bottom: 4, left: 10};
  var TEXT_MARGIN = { top: 4, right: 10, bottom: 10, left: 10};

  var BACKGROUND_FILL = "#333";

  var MIN_TWEET_HEIGHT = AVATAR_SIZE + AVATAR_MARGIN.top + AVATAR_MARGIN.bottom;

  var MAX_TWEETS = 200;

  var Painter = exports.Painter = function (canvas) {
    var self = this;
    self.queue = [];
    self.top = -1;
    self.width = canvas.width;
    self.height = canvas.height;
    self.context = canvas.getContext('2d');
    self.gradient;
    self.imageCache = {};

    function initContext(ctx) {
      self.textHeight = Math.round(self.height/40);
      // ctx.font = 'Lucida ' + Math.round(self.height/20) + 'px';
      ctx.font = 'normal ' + self.textHeight +  'px "Lucida Grande"';
      ctx.textBaseline = 'top';
      // self.gradient = ctx.createLinearGradient(0, 0, 0, TWEET_HEIGHT);
      // self.gradient.addColorStop(0, '#eee');
      // self.gradient.addColorStop(1, '#aaa');
    }

    initContext(self.context);
  };

  Painter.prototype.addToQueue = function (tweet) {
    this.queue.push({ renderInfo: null, tweet: tweet });
    if (this.queue.length > MAX_TWEETS) {
      this.queue.shift();
    } else {
      this.top++;
    }
  };

  Painter.prototype.getImage = function (url) {
    var self = this;
    if (self.imageCache[url]) {
      return self.imageCache[url];
    }

    var img = self.imageCache[url] = new Image();
    img.src = url;
    return img;
  }

  Painter.prototype.paint = function (time) {
    var self = this;
    var ctx = self.context;
    var y = 0;
    var idx = self.top;

    ctx.save();
    // ctx.resetTransform();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    while (y < self.height && idx >= 0) {
      var tweet = self.queue[idx].tweet;
      // console.log(tweet.text);
      var tweetHeight = MIN_TWEET_HEIGHT;
      ctx.beginPath();
      ctx.fillStyle = BACKGROUND_FILL;
      ctx.rect(0, 0, self.width, tweetHeight);
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(0,0.5);ctx.lineTo(self.width, 0.5);
      ctx.stroke();

      ctx.strokeStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(0, tweetHeight-0.5);ctx.lineTo(self.width, tweetHeight-0.5);
      ctx.stroke();

      var img = self.getImage(tweet.user.profile_image_url);

      ctx.drawImage(img, AVATAR_MARGIN.left, AVATAR_MARGIN.top);

      ctx.fillStyle = '#ffffff';
      // TO DO:
      //   * Screen Name
      ctx.fillText(tweet.user.name,
                   AVATAR_MARGIN.left + AVATAR_SIZE + USER_MARGIN.left,
                   USER_MARGIN.top);

      ctx.fillStyle = '#808080';
      ctx.textAlign = 'right';
      // TO DO:
      //   * Better time descriptions
      var d = new Date(tweet.created_at);
      var timeStr = d.getHours() + ':' + d.getMinutes();
      ctx.fillText(timeStr,
                   self.width - TIME_MARGIN.right,
                   TIME_MARGIN.top);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#c0c0c0';
      // TO DO:
      //   * Line breaks
      //   * Wrapping
      ctx.fillText(tweet.text,
                   AVATAR_MARGIN.left + AVATAR_SIZE + TEXT_MARGIN.left,
                   USER_MARGIN.top + self.textHeight + TEXT_MARGIN.top);

      ctx.translate(0, tweetHeight);
      y += tweetHeight;
      idx--;
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, self.width, self.height - y);

    ctx.restore();
  };
})(typeof exports === 'undefined' ? this['TweetPainter']={} : exports);
