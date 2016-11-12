const rp = require('request-promise');
const cheerio = require('cheerio');
const Joi = require('joi');

const getHeroesProgress = function (tag, region, platform, mode, next) { // eslint-disable-line

  let url = `https://playoverwatch.com/en-us/career/${platform}/${region}/${tag}`;

  if (platform === 'psn' || platform === 'xbl') {
    url = `https://playoverwatch.com/en-us/career/${platform}/${tag}`;
  }

  rp(url)
    .then((htmlString) => {
      const $ = cheerio.load(htmlString, { xmlMode: true });
      const heroes = [];
      const names = [];
      const percentage = [];
      const images = [];


      console.log($(`#${mode} .hero-comparison-section`).html());

      $(`#${mode} .hero-comparison-section .is-active > div img`).each((i, el) => {
        const image = $(el).attr('src');
        images[i] = image;
      });

      $(`#${mode} .hero-comparison-section .is-active > div `).each((i, el) => {
        const div = $(el).data('overwatchProgressPercent');
        percentage[i] = div;
      });

      $(`#${mode} .hero-comparison-section .is-active > div .bar-text .title `).each((i, el) => {
        const name = $(el).html();
        names[i] = name;
      });

      $(`#${mode} .hero-comparison-section .is-active > div .bar-text .description `).each((i, el) => {
        const hours = $(el).html();
        heroes.push({ name: names[i], playtime: hours, image: images[i], percentage: percentage[i] });
      });

      return next(null, JSON.stringify(heroes));
    }).catch(() => next(null, { statusCode: 404, error: `Found no user with the BattleTag: ${tag}` }));
};

exports.register = function (server, options, next) { // eslint-disable-line

  server.method('getHeroesProgress', getHeroesProgress, {
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
    path: '/{platform}/{region}/{tag}/{mode}/heroes',

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
            .valid(['competitive', 'quickplay'])
            .description('Either competitive-play or quick-play'),
        },
      },
      description: 'Get  overall hero stats',
      notes: 'Api is Case-sensitive !',
    },
    handler: (request, reply) => {
      // https://playoverwatch.com/en-us/career/pc/eu/
      const tag = encodeURIComponent(request.params.tag);
      const region = encodeURIComponent(request.params.region);
      const platform = encodeURIComponent(request.params.platform);
      const mode = encodeURIComponent(request.params.mode);

      server.methods.getHeroesProgress(tag, region, platform, mode, (err, result) => {
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
  name: 'routes-heroes',
};
