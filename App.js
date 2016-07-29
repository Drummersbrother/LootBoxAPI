'use strict';

const Hapi = require('hapi');
const Glue = require('glue');

// Create a server with a host and port
/*const server = new Hapi.Server();

server.connection({
    port: 9001,
    routes: {
        cors: {
            origin: ['*'],
        }
    }
});*/

const manifest = {
    server: {
        cache: [{
            engine: 'catbox-mongodb',
            uri: 'mongodb://127.0.0.1:27017',
            partition: 'cache',
            name:'mongo'
        }]
    },
    connections: [{
        host: 'localhost',
        port: 9000,
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
                select: 'api',
            }
        }, {
            plugin: {
                register: 'vision'
            },
            options: {
                select: 'api',
            }
        }, {
            plugin: {
                register: 'hapi-swagger',
                options: {
                    jsonPath: "/documentation/swagger.json",
                    schemes: ['https'],
                    info: {
                        'title': 'Unofficial Overwatch API',
                        'version': '0.6',
                    },
                }
            },
            options: {
                select: 'api',
            }
        }, {
            plugin: {
                register: './routes/patch_notes.js'
            },
            options: {
                select: 'api',
            }
        }, {
            plugin: {
                register: './routes/achievements.js'
            },
            options: {
                select: 'api',
            }
        }, {
            plugin: {
                register: './routes/allHeroes.js'
            },
            options: {
                select: 'api',
            }
        }, {
            plugin: {
                register: './routes/heroes.js'
            },
            options: {
                select: 'api',
            }
        }, {
            plugin: {
                register: './routes/hero.js'
            },
            options: {
                select: 'api',
            }
        }, {
            plugin: {
                register: './routes/profile.js'
            },
            options: {
                select: 'api',
            }
        }, {
            plugin: {
                register: './routes/get-platforms.js'
            },
            options: {
                select: 'api',
            }
        }



    ]
};
const options = {
    relativeTo: __dirname
};

Glue.compose(manifest, options, (err, server) => {

    if (err) {
        throw err;
    }
    server.route({ method: 'GET', path: '/favicon.ico', handler: { file: 'favicon.ico' }, config: { cache: { expiresIn: 86400000 } } })


    server.start(() => {
        console.log('\x1b[36m', "╔══════════════════════════════════════════╗", '\x1b[0m');
        console.log('\x1b[36m', "║ LootBox Api - An unoffical Overwatch Api ║", '\x1b[0m');
        console.log('\x1b[36m', "║                                          ║", '\x1b[0m');
        console.log('\x1b[36m', "║                                          ║", '\x1b[0m');
        console.log('\x1b[36m', "╚══════════════════════════════════════════╝", '\x1b[0m');

    });
});
