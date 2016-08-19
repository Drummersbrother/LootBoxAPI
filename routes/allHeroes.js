const rp = require('request-promise');
const cheerio = require('cheerio');
const Joi = require('joi');

const getallHeroes = function (tag, region, platform, mode, next) { // eslint-disable-line

  let url = `https://playoverwatch.com/en-us/career/${platform}/${region}/${tag}`;
  const obj = {};

  if (platform === 'psn' || platform === 'xbl') {
    url = `https://playoverwatch.com/en-us/career/${platform}/${tag}`;
  }
  rp(url)
    .then((htmlString) => {
      const $ = cheerio.load(htmlString, { xmlMode: true });
      $(`#${mode} .career-stats-section div .row[data-category-id="0x02E00000FFFFFFFF"] div`).each((i) => {
        $(`#${mode} .career-stats-section div .row[data-category-id="0x02E00000FFFFFFFF"] div:nth-child(${i}) .card-stat-block table tbody tr`).each((i2, el) => {
          const statsName = $(el).children('td:nth-child(1)').html().replace(/ /g, '');
          const statsValue = $(el).children('td:nth-child(2)').html().replace(/ /g, '');

          obj[statsName] = statsValue;
        });
      });
      return next(null, obj);
    }).catch(() => next(null, { statusCode: 404, error: `Found no user with the BattleTag: ${tag}` }));
};

exports.register = function (server, options, next) { // eslint-disable-line

  server.method('getallHeroes', getallHeroes, {
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
    path: '/{platform}/{region}/{tag}/{mode}/allHeroes/',
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
          mode: Joi.string()
            .required()
            .insensitive()
            .valid(['competitive-play', 'quick-play'])
            .description('Either competitive-play or quick-play'),
        },
      },
      description: 'Get Stats for a all heroes',
      notes: 'Api is Case-sensitive !',
    },
    handler: (request, reply) => {
      const tag = encodeURIComponent(request.params.tag);
      const region = encodeURIComponent(request.params.region);
      const platform = encodeURIComponent(request.params.platform);
      const mode = encodeURIComponent(request.params.mode);

      server.methods.getallHeroes(tag, region, platform, mode, (err, result) => {
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
  name: 'routes-allHeroes',
};
