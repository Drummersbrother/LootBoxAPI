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
                    'version': '0.5',
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
        console.log(err)
        throw err;
    }
    server.start(() => {

    });
});
