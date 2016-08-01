const rp = require('request-promise')

const getPatchNotes = function (next) {
  rp('https://cache-eu.battle.net/system/cms/oauth/api/patchnote/list?program=pro&region=US&locale=enUS&type=RETAIL&page=1&pageSize=5&orderBy=buildNumber&buildNumberMin=0')
    .then(function (json) {
      return next(null, JSON.parse(json))
    }).catch(function () {
      return next(null, { 'statusCode': 404, 'error': 'error accured' })
    })
}

exports.register = function (server, options, next) {
  server.method('getPatchNotes', getPatchNotes, {
    cache: {
      cache: 'mongo',
      expiresIn: 6 * 10000, // 10 minutes
      generateTimeout: 40000,
      staleTimeout: 10000,
      staleIn: 20000
    }
  })

  server.route({
    method: 'GET',
    path: '/patch_notes',
    config: {
      tags: ['api'],
      cors: true,
      description: 'Get the latest patch informations',
      notes: ' '
    },
    handler: function (request, reply) {
      server.methods.getPatchNotes((err, result) => {
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
  name: 'routes-patch-notes'
}
