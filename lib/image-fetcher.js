var Canvas = require('openvg-canvas');
var http = require('http');
var util = require('util');

var req_num = 0;

var fetcher = module.exports = function (url) {
  var img = new Canvas.Image();

  var img_num = req_num++;

  http.get(url, function (res) {
    res.setEncoding('binary');
    if (res.statusCode === 200) {
      var buffer = new Buffer(parseInt(res.headers['content-length'], 10));
      var offset = 0;

      res.on('data', function(data) {
        buffer.write(data, offset, 'binary');
        offset += data.length;
      });
      res.on('end', function() {
        img.src = buffer;
      });
    }
  });

  return img;
};
