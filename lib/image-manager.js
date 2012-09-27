var Canvas = require('openvg-canvas');
var http = require('http');
var util = require('util');

var req_num = 0;

OpenVGImageManager = module.exports = function () {
  this.fetch = function (url) {
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
          if (!img.vgDestroyed) {
            img.src = buffer;
          }
        });
      }
    });

    return img;
  };

  this.dispose = function (image) {
    image.vgDestroy();
  };
};
