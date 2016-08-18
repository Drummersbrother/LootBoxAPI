const rp = require('request-promise');
const Joi = require('joi');

const getPlatforms = (tag, next) => { // eslint-disable-line

  rp(`https://playoverwatch.com/en-us/career/get-platforms/${tag}`)
    .then((htmlString) => {
      const profile = JSON.parse(htmlString);
      return next(null, { profile });
    })
    .catch(() => next(null, { statusCode: 404, error: `Found no user with the BattleTag: ${tag}` }));
};

exports.register = function (server, options, next) { // eslint-disable-line

  server.method('getPlatforms', getPlatforms, {
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
    path: '/{platform}/{region}/{tag}/get-platforms',
    config: {
      tags: ['api'],
      plugins: {
        'hapi-rate-limit': {
          pathLimit: 50,
        },
      },
      validate: {
        params: {
          tag: Joi.string()
            .required()
            // .regex(/^(?:[a-zA-Z\u00C0-\u017F0-9]{3,12}-[0-9]{4,},)?(?:[a-zA-Z\u00C0-\u017F0-9]{3,12}-[0-9]{4,})$/g)
            .description('the battle-tag of the user | "#" should be replaced by an "-"'),
          platform: Joi.string()
            .required()
            .insensitive()
            .valid(['pc', 'xbl', 'psn'])
            .description('the platform that the user use: pc,xbl,psn'),
          region: Joi.string()
            .required()
            .insensitive()
            .valid(['eu', 'us', 'kr', 'cn', 'global'])
            .description('the region the user live is in for example: eu'),
        },
      },
      description: 'Check if the user owns a copy for another platform',
      notes: ' ',
    },
    handler: (request, reply) => {
      // https://playoverwatch.com/en-us/career/pc/eu/
      const tag = encodeURIComponent(request.params.tag);

      server.methods.getPlatforms(tag, (err, result) => {
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
  name: 'routes-get-platforms',
};
