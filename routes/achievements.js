const rp = require('request-promise');
const cheerio = require('cheerio');
const Joi = require('joi');

const getAchievements = function (tag, region, platform, next) { // eslint-disable-line

  let url = `https://playoverwatch.com/en-us/career/${platform}/${region}/${tag}`;
  if (platform === 'psn' || platform === 'xbl') {
    url = `https://playoverwatch.com/en-us/career/${platform}/${tag}`;
  }

  rp(url)
    .then((htmlString) => {
      const $ = cheerio.load(htmlString, { xmlMode: true });
      const Achievements = [];
      let enabledCount = 0;

      $('#achievements-section .toggle-display .media-card').each((i, el) => {
        const imageUrl = $(el).children('img').attr('src'); // media-card-caption
        const title = $(el).children('.media-card-caption').children('.media-card-title').html();
        const finished = $(el).hasClass('m-disabled');
        /* eslint-disable  newline-per-chained-call*/
        const achievementDescription = $(el).parent().children(`#${$(el).attr('data-tooltip')}`).children('p').html();
        const categoryName = $(el).parent().parent().parent().parent().parent().children('.js-career-select').children(`option[value="${$(el).parent().parent().parent().attr('data-category-id')}"]`).html();
        /* eslint-enable newline-per-chained-call*/
        if (finished === false) {
          Achievements.push({ name: title, finished: true, image: imageUrl, description: achievementDescription, category: categoryName });
          enabledCount++;
        } else {
          Achievements.push({ name: title, finished: false, image: imageUrl, description: achievementDescription, category: categoryName });
        }
      });
      const allAchievements = $('#achievements-section .toggle-display .media-card').length;
      return next(null, JSON.stringify({ totalNumberOfAchievements: allAchievements, numberOfAchievementsCompleted: enabledCount, finishedAchievements: `${enabledCount} / ${allAchievements}`, achievements: Achievements }));
    }).catch(() => next(null, { statusCode: 404, error: `Found no user with the BattleTag: ${tag}` }));
};

exports.register = function (server, options, next) { // eslint-disable-line
  server.method('getAchievements', getAchievements, {
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
    path: '/{platform}/{region}/{tag}/achievements',

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
      description: 'Get the users achievements',
      notes: 'Api is Case-sensitive !',
    },
    handler: (request, reply) => {
      // https://playoverwatch.com/en-us/career/pc/eu/
      const tag = encodeURIComponent(request.params.tag);
      const region = encodeURIComponent(request.params.region);
      const platform = encodeURIComponent(request.params.platform);

      server.methods.getAchievements(tag, region, platform, (err, result) => {
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
  name: 'routes-achievements',
};
