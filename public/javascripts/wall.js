// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

(function initWall() {
  var canvas = document.getElementById('the-canvas');
  var painter = new TweetPainter.Painter(canvas);

  function paint(time) {
    painter.paint(time);
    window.requestAnimationFrame(paint);
  }

  function dataGenerator() {
    var time = new Date().toString();

    painter.addToQueue({
      text: 'Blah blah blah',
      created_at: time,
      retweeted: false,
      user: {
        profile_image_url_https: 'https://si0.twimg.com/profile_images/2407639998/image_normal.jpg',
        profile_image_url: 'http://a0.twimg.com/profile_images/2407639998/image_normal.jpg',
        created_at: 'Fri Sep 21 20:51:55 +0000 2012',
        screen_name: 'caseycapachi',
        name: 'Casey Capachi'
      }
    });

    setTimeout(dataGenerator, Math.random() * 1000);
  }

  var socket = io.connect(window.location.protocol + '//' + window.location.host);
  socket.on('tweet', function (tweet) {
    painter.addToQueue(tweet);
    // console.log(data);
    // socket.emit('my other event', { my: 'data' });
  });

  // dataGenerator();
  paint();
})();
