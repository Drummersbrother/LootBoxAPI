const MongoClient = require('mongodb').MongoClient;
const promise = require('bluebird');


exports.register = function (server, options, next) { // eslint-disable-line

  const getSignatureList = function(mode,id,next) { // eslint-disable-line
    promise.coroutine( function *() { // eslint-disable-line
      const db = yield MongoClient.connect('mongodb://localhost:27017/signatures', {
        server: {
          reconnectTries: Infinity,
          autoReconnect: true,
          socketOptions: {
            connectTimeoutMS: 5000,
            keepAlive: 1,
          },
        },
      });

      const signatures = yield db.collection('signatures').find({}, { images: 0 }).toArray();
      return signatures;
    })().then((signatures) => { // eslint-disable-line
      return next(null, { signatures });
    });
  };

  server.method('getSignatureList', getSignatureList, {
  });

  server.route({
    method: 'GET',
    path: '/listSignatures',
    config: {
      tags: ['signature'],
      description: 'Get Stats for a specific hero',
      notes: ' ',
    },
    handler: (request, reply) => {
      const id = encodeURIComponent(request.params.id);
      const mode = encodeURIComponent(request.params.mode);

      server.methods.getSignatureList(mode, id, (err, result) => {
        reply(result);
      });
    },
  });
  return next();
};

exports.register.attributes = {
  name: 'routes-listSignature',
};
