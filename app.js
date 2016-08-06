'use strict'

const Glue = require('glue')
const env = process.env
let port
let host
let connectionString
let partition
if (env.NODE_PORT === undefined && env.docker === undefined) {
  port = 9000
  host = 'localhost'
  connectionString = '127.0.0.1:27017'
  partition = 'cache'
} else if (env.docker !== undefined) {
  port = 9000
  host = '0.0.0.0'
  connectionString =  "db"+ ':' + "27017"
} else {
  port = env.NODE_PORT
  host = env.NODE_IP
  partition = env.OPENSHIFT_APP_NAME
  connectionString = env.OPENSHIFT_MONGODB_DB_USERNAME + ':' +
  env.OPENSHIFT_MONGODB_DB_PASSWORD + '@' +
  env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  env.OPENSHIFT_APP_NAME
}

const manifest = {
  server: {
    cache: [{
      engine: 'catbox-mongodb',
      uri: 'mongodb://' + connectionString,
      partition: partition,
      name: 'mongo'
    }]
  },
  connections: [{
    host: host,
    port: port,
    labels: ['api'],
    routes: {
      cors: true
    }
  }],
  registrations: [{
    plugin: {
      register: 'inert'
    },
    options: {
      select: 'api'
    }
  }, {
    plugin: {
      register: 'vision'
    },
    options: {
      select: 'api'
    }
  }, {
    plugin: {
      register: 'hapi-swagger',
      options: {
        jsonPath: '/documentation/swagger.json',
        schemes: ['https'],
        info: {
          'title': 'Unofficial Overwatch API',
          'version': '1.0'
        }
      }
    },
    options: {
      select: 'api'
    }
  }, {
    plugin: {
      register: './routes/patch_notes.js'
    },
    options: {
      select: 'api'
    }
  }, {
    plugin: {
      register: './routes/achievements.js'
    },
    options: {
      select: 'api'
    }
  }, {
    plugin: {
      register: './routes/allHeroes.js'
    },
    options: {
      select: 'api'
    }
  }, {
    plugin: {
      register: './routes/heroes.js'
    },
    options: {
      select: 'api'
    }
  }, {
    plugin: {
      register: './routes/hero.js'
    },
    options: {
      select: 'api'
    }
  }, {
    plugin: {
      register: './routes/profile.js'
    },
    options: {
      select: 'api'
    }
  }, {
    plugin: {
      register: './routes/get-platforms.js'
    },
    options: {
      select: 'api'
    }
  }

  ]
}
const options = {
  relativeTo: __dirname
}

Glue.compose(manifest, options, (err, server) => {
  if (err) {
    throw err
  }
  server.route({ method: 'GET', path: '/favicon.ico', handler: { file: 'favicon.ico' }, config: { cache: { expiresIn: 86400000 } } })
  if (!module.parent) {
    server.start(() => {
      console.log('\x1b[36m', '╔══════════════════════════════════════════╗', '\x1b[0m')
      console.log('\x1b[36m', '║ LootBox Api - An unoffical Overwatch Api ║', '\x1b[0m')
      console.log('\x1b[36m', '║                                          ║', '\x1b[0m')
      console.log('\x1b[36m', '║                                          ║', '\x1b[0m')
      console.log('\x1b[36m', '╚══════════════════════════════════════════╝', '\x1b[0m')
    })
  } else {
    module.exports = server
  }
})
