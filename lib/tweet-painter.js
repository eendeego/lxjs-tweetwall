/*jslint indent: 2 */

// http://caolanmcmahon.com/posts/writing_for_node_and_the_browser
(function (exports) {
  "use strict";

  var AVATAR_SIZE = 48;

  var AVATAR_MARGIN = { top: 10, right: 10, bottom: 10, left: 10};
  var USER_MARGIN = { top: 10, right: 10, bottom: 8, left: 10};
  var TIME_MARGIN = { top: 10, right: 10, bottom: 4, left: 10};
  var TEXT_MARGIN = { top: 8, right: 10, bottom: 10, left: 10};

  var BACKGROUND_FILL = "#333";

  var MIN_TWEET_HEIGHT = AVATAR_SIZE + AVATAR_MARGIN.top + AVATAR_MARGIN.bottom;

  var MAX_TWEETS = 200;

  function BrowserImageManager() {
    this.fetch = function (url) {
      var img = new Image();
      img.src = url;
      return img;
    };
    this.dispose = function (image) {
      // No-op: the browser takes care of everything
    };
  }

  function noop(text) {
    return text;
  }

  var Painter = exports.Painter = function (canvas, options) {
    var self = this;
    self.queue = [];
    self.top = -1;
    self.descendSpeed = 0;
    self.startY = 0;
    self.width = canvas.width;
    self.height = canvas.height;
    self.context = canvas.getContext('2d');
    self.imageCache = {};
    self.options = options;

    self.imageManager = options.imageManager || new BrowserImageManager();
    self.htmlUnencode = options.htmlUnencode || noop; // Temporary noop

    self.textWidth = self.width - (AVATAR_MARGIN.left + AVATAR_SIZE + Math.max(AVATAR_MARGIN.right, TEXT_MARGIN.left) + TEXT_MARGIN.right);

    function initContext(ctx) {
      self.textHeight = Math.round(self.height / 50);
      self.lineHeight = self.textHeight * 1.4; // TO DO: fetch this
      self.userHeight = self.textHeight * 0.8;
      self.userFont = 'normal ' + self.userHeight +  'px "Lucida Grande", sans';
      self.textFont = 'normal ' + self.textHeight +  'px "Lucida Grande", sans';
      ctx.font = self.userFont;
      self.spaceWidth = ctx.measureText(' ').width;
      ctx.textBaseline = 'top';
      // self.gradient = ctx.createLinearGradient(0, 0, 0, TWEET_HEIGHT);
      // self.gradient.addColorStop(0, '#eee');
      // self.gradient.addColorStop(1, '#aaa');
    }

    initContext(self.context);
  };

  Painter.prototype.addToQueue = function (tweet) {
    this.queue.push({
      tweet: tweet,
      height : undefined,
      lines : undefined,
      image : undefined
    });
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

    var img = self.imageCache[url] = self.imageManager.fetch(url);
    return img;
  };

  Painter.prototype.paint = function (time) {
    var self = this;
    var ctx = self.context;
    var y;
    var idx = self.top;
    var i, j;

    if (self.startY < 0) {
      self.descendSpeed += Math.floor(-self.startY / self.height * 100) + 1;
    } else {
      self.descendSpeed = 0;
    }

    self.startY += self.descendSpeed;

    if (self.startY > 0) {
      self.startY = self.descendSpeed = 0;
    }
    y = self.startY;

    ctx.save();

    while (y < self.height && idx >= 0) {
      var tweetInfo = self.queue[idx];
      var tweet     = tweetInfo.tweet;
      if (!tweetInfo.height) {
        var tweetHeight = USER_MARGIN.top + self.userHeight +
          Math.max(USER_MARGIN.bottom, TEXT_MARGIN.top) +
          // Actual text height +
          TEXT_MARGIN.bottom;

        ctx.font = 'normal ' + self.textHeight +  'px "Lucida Grande", sans';

        var lines = self.htmlUnencode(tweet.text).split('\n');
        for (i = 0; i < lines.length; i++) {
          var m = ctx.measureText(lines[i]);
          if (m.width > self.textWidth) {
            var words = tweet.text.split(' ');
            var word = words.shift();
            var line = [word];
            var tw = ctx.measureText(word).width;
            for (j = 0; j < words.length && tw < self.textWidth; j++) {
              word = words.shift();
              tw += self.spaceWidth + ctx.measureText(word).width;
              if (tw < self.textWidth) {
                line.push(word);
              } else {
                words.unshift(word);
              }
            }

            if (j === 0) {
              // TO DO: word wider than screen
            }

            lines.splice(i, 1, line.join(' '), words.join(' '));
          }
          // // console.log("Metrics: " + require('util').inspect(m));
          // // if (m)
          // For now, just add text height
          tweetHeight += self.lineHeight;
        }
        tweetInfo.height = Math.round(tweetHeight);
        tweetInfo.lines = lines;
        tweetInfo.image = self.getImage(tweet.user.profile_image_url);

        // This is definitly a new tweet, make it start "over" the display
        self.startY -= tweetHeight;
        y -= tweetHeight;
      }

      ctx.setTransform(1, 0, 0, 1, 0, y);

      // background
      ctx.beginPath();
      ctx.fillStyle = BACKGROUND_FILL;
      ctx.rect(0, 0, self.width, tweetInfo.height);
      ctx.fill();

      // top border
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(0, 0.5);
      ctx.lineTo(self.width, 0.5);
      ctx.stroke();

      // bottom border
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(0, tweetInfo.height - 0.5);
      ctx.lineTo(self.width, tweetInfo.height - 0.5);
      ctx.stroke();

      // avatar
      ctx.drawImage(tweetInfo.image, AVATAR_MARGIN.left, AVATAR_MARGIN.top);

      ctx.font = self.userFont;
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

      ctx.font = self.textFont;
      ctx.fillStyle = '#c0c0c0';
      for (i = 0; i < tweetInfo.lines.length; i++) {
        ctx.fillText(tweetInfo.lines[i],
                     AVATAR_MARGIN.left + AVATAR_SIZE + TEXT_MARGIN.left,
                     USER_MARGIN.top + self.userHeight + Math.max(USER_MARGIN.bottom, TEXT_MARGIN.top) +
                     i * self.lineHeight);
      }

      ctx.translate(0, tweetInfo.height);
      y += tweetInfo.height;
      idx--;
    }

    if (y < self.height) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, self.width, self.height - y);
    } else {
      if (idx >= 0) {
        idx++;
        for (j = 0; j < idx; j++) {
          self.imageManager.dispose(self.queue[j].image);
        }
        self.queue.splice(0, idx);
        self.top -= idx;
      }
    }

    ctx.restore();
  };
})(typeof exports === 'undefined' ? this['TweetPainter'] = {} : exports);
