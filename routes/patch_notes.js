var rp = require('request-promise');
var tidy = require('htmltidy2').tidy;
var cheerio = require('cheerio');

JSON.fix = function(obj) {
    return obj.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
};

exports.register = function(server, options, next) {

    server.route({
        method: 'GET',
        path: '/patch_notes',
        config: {
            tags: ['api'],
            cors: true,
            description: 'Get the latest patch informations',
            notes: " ",
        },
        handler: function(request, reply) {
            //https://playoverwatch.com/en-us/career/pc/eu/
            //https://cache-eu.battle.net/system/cms/oauth/api/patchnote/list?program=pro&region=EU&locale=deDE&type=RETAIL&page=1&pageSize=5&orderBy=buildNumber&buildNumberMin=0&buildNumberMax=
            //
            rp('https://cache-eu.battle.net/system/cms/oauth/api/patchnote/list?program=pro&region=US&locale=enUS&type=RETAIL&page=1&pageSize=5&orderBy=buildNumber&buildNumberMin=0')
                .then(function(json) {

                        //$ = cheerio.load(htmlString, { xmlMode: true });
                       //var json = JSON.parse(htmlString);
                        /*
                        $('.Search-content > .Post--searchPage').each(function(i, el) {
                            var title = $(this).children('a').children('div').children('div').children('.Post-body--topicTitle').html();
                            var text = $(this).children('a').children('div').children('div').children('.Post-body--postContent').html();
                            content.push({ title: title, text: text });
                        });*/
                        reply(JSON.parse(json));
                }).catch(function(err) {
                    console.log(err)
                    reply({ "statusCode": 404, "error": "error accured"})
                });;
        }
    });

    return next();
};


exports.register.attributes = {
    name: 'routes-patch-notes'
};
