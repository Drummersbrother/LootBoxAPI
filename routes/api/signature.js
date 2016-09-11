const path = require('path');

exports.register = function (server, options, next) { // eslint-disable-line

  server.route({
        method: 'GET',
        path: '/{platform}/{region}/{tag}/signature/{hero}/signature.png',
        config: { cache: { expiresIn: 86400000 }},
        handler: function(request, reply) {
          var image = reply.file(path.resolve('assets/'+'warning.png'), {
            filename: 'signature.png'
          }).header('Content-Type', 'image/png').code(200).hold();
          return image.send();
        },
  });

  return next();
};

exports.register.attributes = {
  name: 'routes-signature',
};
