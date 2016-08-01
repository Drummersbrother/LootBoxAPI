const rp = require('request-promise')
const cheerio = require('cheerio')
const Joi = require('joi')

const getallHeroes = function (tag, region, platform, mode, next) {
  let url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + region + '/' + tag

  if (platform === 'psn' || platform === 'xbl' && region === 'global') {
    url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + tag
  }

  let obj = {}

  rp(url)
    .then(function (htmlString) {
      const $ = cheerio.load(htmlString, { xmlMode: true })
      // #quick-play > section.content-box.max-width-container.career-stats-section > div > div.row.gutter-18\40 md.spacer-12.spacer-18\40 md.js-stats.toggle-display.is-active
      $('#' + mode + ' .career-stats-section div .row[data-category-id="0x02E00000FFFFFFFF"] div').each(function (i, el) {
        $('#' + mode + ' .career-stats-section div .row[data-category-id="0x02E00000FFFFFFFF"] div:nth-child(' + i + ') .card-stat-block table tbody tr').each(function (i, el) {
          const statsName = $(this).children('td:nth-child(1)').html().replace(/ /g, '')
          const statsValue = $(this).children('td:nth-child(2)').html().replace(/ /g, '')

          obj[statsName] = statsValue
        })
      })
      return next(null, obj)
    }).catch(function () {
      return next(null, { 'statusCode': 404, 'error': 'Found no user with the BattleTag: ' + tag })
    })
}

exports.register = function (server, options, next) {
  server.method('getallHeroes', getallHeroes, {
    /* cache: {
        cache: 'mongo',
        expiresIn: 6 * 10000, // 10 minutes
        generateTimeout: 40000,
        staleTimeout: 10000,
        staleIn: 20000,

    }*/
  })

  server.route({
    method: 'GET',
    path: '/{platform}/{region}/{tag}/{mode}/allHeroes/',
    config: {
      tags: ['api'],
      validate: {
        params: {
          tag: Joi.string()
            .required()
            .regex(/^(?:[a-zA-Z\u00C0-\u017F0-9]{3,12}-[0-9]{4,},)?(?:[a-zA-Z\u00C0-\u017F0-9]{3,12}-[0-9]{4,})$/g)
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
            .description('Either competitive-play or quick-play')
        }
      },
      description: 'Get Stats for a all heroes',
      notes: 'Api is Case-sensitive !'
    },
    handler: function (request, reply) {
      const tag = encodeURIComponent(request.params.tag)
      const region = encodeURIComponent(request.params.region)
      const platform = encodeURIComponent(request.params.platform)
      const mode = encodeURIComponent(request.params.mode)

      server.methods.getallHeroes(tag, region, platform, mode, (err, result) => {
        if (err) {
          return reply(err)
        }

        reply(result)
      })
    }
  })
  return next()
}

exports.register.attributes = {
  name: 'routes-allHeroes'
}
