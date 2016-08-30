const MongoClient = require('mongodb').MongoClient;
const promise = require('bluebird');

exports.register = function (server, options, next) { // eslint-disable-line
  const createSignature = function(inputTag, inputRegion, inputPlatform, next) { // eslint-disable-line

    promise.coroutine(function *() {  // eslint-disable-line
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
      const user = yield db.collection('signatures').findOne({ tag: inputTag });
      if (user === null) {
        const field = yield db.collection('signatures').insert({ tag: inputTag, additionalInfo: { region: inputRegion, platform: inputPlatform } });
        if (field !== null) {
          return next(null, { info: `Signature for "${inputTag}" got created.`, url: `quick/${field.insertedIds[1]}.png` });
        }
      } else {
        console.log(user);
        return next(null, { info: `Signature for "${inputTag}" already exists.`, url: `quick/${user._id}.png` }); // eslint-disable-line
      }
    })().catch((err) => {
      console.log(err);
    });
  };

  server.method('createSignature', createSignature, {
    cache: {
      cache: 'mongo',
      expiresIn: 6 * 10000, // 10 minutes
      generateTimeout: 40000,
      staleTimeout: 10000,
      staleIn: 20000,
    },
  });

  server.route({
    method: 'GET',
    path: '/{platform}/{region}/{tag}/createSignature/',
    config: {
      tags: ['signature'],
      description: 'Get Stats for a specific hero',
      notes: ' ',
    },
    handler: (request, reply) => {
      const tag = encodeURIComponent(request.params.tag);
      const region = encodeURIComponent(request.params.region);
      const platform = encodeURIComponent(request.params.platform);

      server.methods.createSignature(tag, region, platform, (err, result) => {
        if (err) {
          return reply(err);
        }

        return reply(result);
      });
    },
  });
  return next();
};

exports.register.attributes = {
  name: 'routes-createSignature',
};
