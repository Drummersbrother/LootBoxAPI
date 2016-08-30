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
  }, {
    host: hostUrl,
    port: 9001,
    labels: ['signatures'],
    routes: {
      cors: true,
    },
  }],
  registrations: [{
    plugin: {
      register: 'inert',
    },
    options: {
    },
  }, {
    plugin: {
      register: 'vision',
    },
    options: {
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
      register: './routes/api/patch_notes.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/api/achievements.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/api/allHeroes.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/api/heroes.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/api/hero.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/api/profile.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/api/get-platforms.js',
    },
    options: {
      select: 'api',
    },
  }, {
    plugin: {
      register: './routes/signatures/createSignature.js',
    },
    options: {
      select: 'signatures',
    },
  }, {
    plugin: {
      register: './routes/signatures/updateSignature.js',
    },
    options: {
      select: 'signatures',
    },
  }, {
    plugin: {
      register: './routes/signatures/getSignature.js',
    },
    options: {
      select: 'signatures',
    },
  }, {
    plugin: {
      register: './routes/signatures/listSignature.js',
    },
    options: {
      select: 'signatures',
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
  server.route({ method: 'GET', path: '/requests', handler: { file: 'requests.html' } });
  server.route({ method: 'GET', path: '/image', handler: { file: 'assets/test.png' } });

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
