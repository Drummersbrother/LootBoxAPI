var rp = require('request-promise');
var tidy = require('htmltidy2').tidy;
var cheerio = require('cheerio');
var Joi = require("joi");

exports.register = function(server, options, next) {
    server.route({
        method: 'GET',
        path: '/{platform}/{region}/{tag}/{mode}/heroes',

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
                    mode: Joi.string()
                        .required()
                        .description('Either competitive-play or quick-play'),
                }
            },
            description: 'Get  overall hero stats',
            notes: "Api is Case-sensitive !"
        },
        handler: function(request, reply) {
            //https://playoverwatch.com/en-us/career/pc/eu/
            var tag = encodeURIComponent(request.params.tag);
            var region = encodeURIComponent(request.params.region);
            var platform = encodeURIComponent(request.params.platform);
            var mode = encodeURIComponent(request.params.mode);

            var url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + region + '/' + tag;


            if (platform == "psn" || platform == "xbl" && region == "global") {
                url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + tag;
            }


            rp(url)
                .then(function(htmlString) {
                    tidy(htmlString, function(err, html) {

                        $ = cheerio.load(htmlString, { xmlMode: true });
                        var heroes = [];
                        var names = [];
                        var percentage = [];
                        var images = [];

                        $('#'+mode+' .hero-comparison-section .is-active > div img').each(function(i, el) {
                            var image = $(this).attr("src");
                            images[i] = image;
                        });


                        $('#'+mode+' .hero-comparison-section .is-active > div').each(function(i, el) {
                            var div = $(this).data('overwatchProgressPercent');
                            percentage[i] = div;
                        });



                        $('#'+mode+' .hero-comparison-section .is-active div .bar-text .title').each(function(i, el) {
                            var name = $(this).html();
                            names[i] = name;
                        });

                        $('#'+mode+' .hero-comparison-section .is-active div .bar-text .description').each(function(i, el) {
                            var hours = $(this).html();
                            heroes.push({ name: names[i], playtime: hours, image: images[i], percentage: percentage[i] });
                        });




                        reply(JSON.stringify(heroes));

                    });



                }).catch(function(err) {
                    reply({ "statusCode": 404, "error": "Found no user with the BattleTag: " + tag })
                });
        }
    });
    return next();
};


exports.register.attributes = {
    name: 'routes-heroes'
};
