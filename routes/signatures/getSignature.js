const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const promise = require('bluebird');

exports.register = function (server, options, next) { // eslint-disable-line

  const updateSignature = (user) => { // eslint-disable-line
    return new Promise((resolve, reject) => {
      if (user !== null) {
        server.methods.updateSignature(user._id, (err) => { // eslint-disable-line
          if (!err) resolve(true);
          else { reject(err); }
        });
      } else {
        reject();
      }
    });
  };

  const getSignature = function(mode,id,next) { // eslint-disable-line

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

      let user = yield db.collection('signatures').findOne({ _id: new ObjectId(id) });

      const updateFinished = yield updateSignature(user);

      if (updateFinished) {
        user = yield db.collection('signatures').findOne({ _id: new ObjectId(id) });
      }

      if (mode === 'comp') {
        const img = new Buffer(user.images.competitivePlayImage, 'base64');
        return next(null, { buffer: img, length: img.length });
      } else if (mode === 'quick') {
        const img = new Buffer(user.images.quickplayImage, 'base64');
        return next(null, { buffer: img, length: img.length });
      }
      else {
        return next(null, { error: `Your mode:"${mode}" does not exists. Choose either comp or quick.` });
      }
    })().catch(() => { // eslint-disable-line
      return next(null, { error: `No signature found with the id: "${id}" found.` });
    });
  };

  server.method('getSignature', getSignature, {
  });

  server.route({
    method: 'GET',
    path: '/{mode}/{id}.png',
    config: {
      tags: ['signature'],
      description: 'Get Stats for a specific hero',
      notes: ' ',
    },
    handler: (request, reply) => {
      const id = encodeURIComponent(request.params.id);
      const mode = encodeURIComponent(request.params.mode);

      server.methods.getSignature(mode, id, (err, result) => {
        if (result.buffer !== undefined) {
          reply(result.buffer).header('Content-Type', 'image/png');
        } else {
          reply(result);
        }
      });
    },
  });
  return next();
};

exports.register.attributes = {
  name: 'routes-getSignature',
};
