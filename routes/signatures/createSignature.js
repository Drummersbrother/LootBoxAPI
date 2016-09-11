const MongoClient = require('mongodb').MongoClient;
const promise = require('bluebird');
const rp = require('request-promise');


exports.register = function (server, options, next) { // eslint-disable-line
  const checkIfItIsValidTag = (tag) =>{ // eslint-disable-line
    return new Promise((resolve, reject) => {
      rp(`https://playoverwatch.com/en-us/search/account-by-name/${tag}`)
        .then((html) => {
          if (html !== "[]") {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(() => {reject(`Your BattleTag: "${inputTag}" could not be found. Check for mistakes and the capitalization.`);})
    });
  };
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
        const isValid = yield checkIfItIsValidTag(inputTag);
        console.log(isValid);
        if (isValid) {
          const field = yield db.collection('signatures').insert({ tag: inputTag, additionalInfo: { region: inputRegion, platform: inputPlatform } });
          if (field !== null) {
            return next(null, { info: `Signature for "${inputTag}" got created.`, url:{ quick: `quick/${field.insertedIds[1]}.png`, comp: `comp/${field.insertedIds[1]}.png` } });
          }
        } else {
          return next(null, { error: `Your BattleTag:"${inputTag}" could not be found. Check for mistakes and the capitalization.`});
        }
      } else {
        return next(null, { info: `Signature for "${inputTag}" already exists.`, url:{ quick: `quick/${user._id}.png`, comp: `comp/${user._id}.png` }}); // eslint-disable-line
      }
    })().catch((err) => {
      return next(null, { error: err }); // eslint-disable-line
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
