const rp = require('request-promise');

const getPatchNotes = function (next) { // eslint-disable-line

  rp('https://cache-eu.battle.net/system/cms/oauth/api/patchnote/list?program=pro&region=US&locale=enUS&type=RETAIL&page=1&pageSize=5&orderBy=buildNumber&buildNumberMin=0')
    .then((json) => next(null, JSON.parse(json)))
    .catch(() => next(null, { statusCode: 404, error: 'Found no patch notes' }));
};

exports.register = function (server, options, next) { // eslint-disable-line

  server.method('getPatchNotes', getPatchNotes, {
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
    path: '/patch_notes',
    config: {
      tags: ['api'],
      plugins: {
        'hapi-rate-limit': {
          pathLimit: 50,
        },
      },
      cors: true,
      description: 'Get the latest patch informations',
      notes: ' ',
    },
    handler: (request, reply) => {
      server.methods.getPatchNotes((err, result) => {
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
  name: 'routes-patch-notes',
};
