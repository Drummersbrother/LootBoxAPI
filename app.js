const Glue = require('glue');

const env = process.env;
let portNumber;
let hostUrl;
let connectionString;
let collectionName;
if (env.NODE_PORT === undefined && env.docker === undefined) {
  portNumber = 9000;
  hostUrl = 'localhost';
  connectionString = '127.0.0.1:27017';
  collectionName = 'cache';
} else if (env.docker !== undefined) {
  portNumber = 9000;
  hostUrl = '0.0.0.0';
  connectionString = 'db:27017';
} else {
  portNumber = env.NODE_PORT;
  hostUrl = env.NODE_IP;
  collectionName = env.OPENSHIFT_APP_NAME;
  /*eslint-disable */
  connectionString = env.OPENSHIFT_MONGODB_DB_USERNAME + ':' + env.OPENSHIFT_MONGODB_DB_PASSWORD + '@' + env.OPENSHIFT_MONGODB_DB_HOST + ':' + env.OPENSHIFT_MONGODB_DB_PORT + '/' + env.OPENSHIFT_APP_NAME;
  /*eslint-enable */
}

const manifest = {
  server: {
    cache: [{
      engine: 'catbox-mongodb',
      uri: `mongodb://${connectionString}`,
      partition: collectionName,
      name: 'mongo',
    }],
  },
  connections: [{
    host: hostUrl,
    port: portNumber,
    labels: ['api'],
    routes: {
      cors: true,
    },
  }],
  registrations: [{
    plugin: {
      register: 'inert',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: 'vision',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: 'hapi-swagger',
      options: {
        jsonPath: '/documentation/swagger.json',
        schemes: ['https'],
        info: {
          title: 'Unofficial Overwatch API',
          version: '1.0',
        },
      },
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: 'hapi-rate-limit',
      // https://github.com/wraithgar/hapi-rate-limit
      options: {
        userCache: {
          expiresIn: 60000,
        },
      },
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/patch_notes.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/achievements.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/allHeroes.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/heroes.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/hero.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/profile.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/get-platforms.js',
    },
    options: {
      select: 'api',
    },
  },
  ],
};
const options = {
  relativeTo: __dirname,
};

Glue.compose(manifest, options, (err, server) => {
  if (err) {
    throw err;
  }
  server.route({ method: 'GET', path: '/favicon.ico', handler: { file: 'favicon.ico' }, config: { cache: { expiresIn: 86400000 } } });
  if (!module.parent) {
    server.start(() => {
      console.log('\x1b[36m', '╔══════════════════════════════════════════╗', '\x1b[0m');
      console.log('\x1b[36m', '║ LootBox Api - An unoffical Overwatch Api ║', '\x1b[0m');
      console.log('\x1b[36m', '║══════════════════════════════════════════║', '\x1b[0m');
      console.log('\x1b[36m', `║ URL: ${server.info.uri}                  ║`, '\x1b[0m');
      console.log('\x1b[36m', '║                                          ║', '\x1b[0m');
      console.log('\x1b[36m', '╚══════════════════════════════════════════╝', '\x1b[0m');
    });
  } else {
    module.exports = server;
  }
});
