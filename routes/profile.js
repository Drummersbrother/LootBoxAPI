const rp = require('request-promise');
const cheerio = require('cheerio');
const Joi = require('joi');

const getProfile = function (tag, region, platform, next) { // eslint-disable-line
  let url = `https://playoverwatch.com/en-us/career/${platform}/${region}/${tag}`;

  if (platform === 'psn' || platform === 'xbl') {
    url = `https://playoverwatch.com/en-us/career/${platform}/${tag}`;
  }

  rp(url)
    .then((htmlString) => {
      const $ = cheerio.load(htmlString);
      const Username = $('.header-masthead').text();

      const gamesWon = {};
      const gamesPlayed = {};
      const timeplayed = {};
      const lost = {};
      let competitiveRank;
      let competitiveRankImg;
      let Star = '';

      const quickgamesWonElm = $('#quickplay td:contains("Games Won")').next().html();
      const quickgamesPlayedElm = $('#quickplay td:contains("Games Played")').next().html();
      const quicktimePlayedElm = $('#quickplay td:contains("Time Played")').next().html();

      const compgamesWonElm = $('#competitive td:contains("Games Won")').next().html();
      const compgamesPlayedElm = $('#competitive td:contains("Games Played")').next().html();
      const comptimePlayedElm = $('#competitive td:contains("Time Played")').next().html();
      const competitiveRankElm = $('.competitive-rank');

      const LevelFrame = $('.player-level').attr('style').slice(21, 109);
      const starElm = $('.player-level .player-rank').html();

      if (competitiveRankElm != null) {
        competitiveRankImg = $('.competitive-rank img').attr('src');
        competitiveRank = $('.competitive-rank div').html();
      }

      if (quickgamesWonElm != null) {
        gamesWon.quick = quickgamesWonElm.trim().replace(/,/g, '');
      }

      if (quickgamesPlayedElm != null) {
        gamesPlayed.quick = quickgamesPlayedElm.trim().replace(/,/g, '');
        lost.quick = gamesPlayed.quick - gamesWon.quick;
      }

      if (quicktimePlayedElm != null) {
        timeplayed.quick = quicktimePlayedElm.trim().replace(/,/g, '');
      }

      if (compgamesWonElm != null) {
        gamesWon.comp = compgamesWonElm.trim().replace(/,/g, '');
      }

      if (compgamesPlayedElm != null) {
        gamesPlayed.comp = compgamesPlayedElm.trim().replace(/,/g, '');
        lost.comp = gamesPlayed.comp - gamesWon.comp;
      }

      if (comptimePlayedElm != null) {
        timeplayed.comp = comptimePlayedElm.trim().replace(/,/g, '');
      }

      if (starElm != null) {
        Star = $('.player-level .player-rank').attr('style').slice(21, 107);
      }
      rp(`https://playoverwatch.com/en-us/search/account-by-name/${tag}`)
        .then((html) => {
          const profiles = JSON.parse(html);
          let profile;
          let searchString;

          if (platform === 'pc') {
            searchString = `/career/${platform}/${region}/${decodeURI(tag)}`;
          } else {
            searchString = `/career/${platform}/${decodeURI(tag)}`;
          }

          for (let i = 0; i < profiles.length; i++) {
            if (profiles[i].careerLink === searchString) profile = profiles[i];
          }
          /* eslint-disable max-len */

          return next(null, {
            data: {
              username: Username,
              level: profile.level,
              games: {
                quick: { wins: gamesWon.quick, lost: lost.quick, played: gamesPlayed.quick },
                competitive: { wins: gamesWon.comp, lost: lost.comp, played: gamesPlayed.comp },
              },
              playtime: { quick: timeplayed.quick, competitive: timeplayed.comp },
              avatar: profile.portrait,
              competitive: { rank: competitiveRank, rank_img: competitiveRankImg },
              levelFrame: LevelFrame,
              star: Star },
          });
          /* eslint-enable max-len */
        });
    }).catch(() => next(null, { statusCode: 404, error: `Found no user with the BattleTag: ${tag}` }));
};

exports.register = function (server, options, next) { // eslint-disable-line
  server.method('getProfile', getProfile, {
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
    path: '/{platform}/{region}/{tag}/profile',

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
      description: 'Get Stats for a specific hero',
      notes: ' ',
    },
    handler: (request, reply) => {
      const tag = encodeURIComponent(request.params.tag);
      const region = encodeURIComponent(request.params.region);
      const platform = encodeURIComponent(request.params.platform);

      server.methods.getProfile(tag, region, platform, (err, result) => {
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
  name: 'routes-profile',
};
