var rp = require('request-promise');
var tidy = require('htmltidy2').tidy;
var cheerio = require('cheerio');
var Joi = require("joi");

exports.register = function(server, options, next) {
    server.route({
        method: 'GET',
        path: '/{platform}/{region}/{tag}/get-platforms',
        config: {
            tags: ['api'],
            validate: {
                params: {
                    tag: Joi.string()
                        .required()
                        .description('the battle-tag of the user | "#" should be replaced by an "-"'),
                    platform: Joi.string()
                        .required()
                        .description('the platform that the user use: pc,xbl,psn'),
                    region: Joi.string()
                        .required()
                        .description('the region the user live is in for example: eu'),
                }
            },
            description: 'Check if the user owns a copy for another platform',
            notes: ' ',
        },
        handler: function(request, reply) {
            //https://playoverwatch.com/en-us/career/pc/eu/
            var tag = encodeURIComponent(request.params.tag);
            var region = encodeURIComponent(request.params.region);
            var platform = encodeURIComponent(request.params.platform);
            var url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + region + '/' + tag;


            if (platform == "psn" || platform == "xbl" && region == "global") {
                url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + tag;
            }


            rp(url)
                .then(function(htmlString) {
                    tidy(htmlString, function(err, html) {

                        $ = cheerio.load(html);
                        var id_script = $('script:nth-of-type(10)').text();
                        var id = id_script.slice(24, 33);

                        rp('https://playoverwatch.com/en-us/career/get-platforms/' + id)
                            .then(function(htmlString) {
                                var profile = JSON.parse(htmlString);
                                reply({ profile });
                            });
                        //reply()

                    })
                }).catch(function(err) {
                    reply({ "statusCode": 404, "error": "Found no user with the BattleTag: " + tag })
                });
        }
    });
    return next();
};


exports.register.attributes = {
    name: 'routes-get-platforms'
};
