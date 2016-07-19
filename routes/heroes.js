const rp = require('request-promise');
const tidy = require('htmltidy2').tidy;
const cheerio = require('cheerio');
const Joi = require("joi");

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
                        .regex(/[A-z]+\-[0-9]+/)
                        .description('the battle-tag of the user | "#" should be replaced by an "-"'),
                    platform: Joi.string()
                        .required()
                        .insensitive()
                        .valid(['pc', 'xbl', 'psn'])
                        .description('the platform that the user use: pc,xbl,psn'),
                    region: Joi.string()
                        .required()
                        .insensitive()
                        .valid(['eu', 'us', 'kr', 'cn'])
                        .description('the region the user live is in for example: eu'),
                    mode: Joi.string()
                        .required()
                        .insensitive()
                        .valid(['competitive-play', 'quick-play'])
                        .description('Either competitive-play or quick-play'),
                }
            },
            description: 'Get  overall hero stats',
            notes: "Api is Case-sensitive !"
        },
        handler: function(request, reply) {
            //https://playoverwatch.com/en-us/career/pc/eu/
            const tag = encodeURIComponent(request.params.tag);
            const region = encodeURIComponent(request.params.region);
            const platform = encodeURIComponent(request.params.platform);
            const mode = encodeURIComponent(request.params.mode);

            let url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + region + '/' + tag;


            if (platform == "psn" || platform == "xbl" && region == "global") {
                url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + tag;
            }


            rp(url)
                .then(function(htmlString) {
                    tidy(htmlString, function(err, html) {

                        const $ = cheerio.load(htmlString, { xmlMode: true });
                        const heroes = [];
                        const names = [];
                        const percentage = [];
                        const images = [];

                        $('#'+mode+' .hero-comparison-section .is-active > div img').each(function(i, el) {
                            const image = $(this).attr("src");
                            images[i] = image;
                        });


                        $('#'+mode+' .hero-comparison-section .is-active > div').each(function(i, el) {
                            const div = $(this).data('overwatchProgressPercent');
                            percentage[i] = div;
                        });



                        $('#'+mode+' .hero-comparison-section .is-active div .bar-text .title').each(function(i, el) {
                            const name = $(this).html();
                            names[i] = name;
                        });

                        $('#'+mode+' .hero-comparison-section .is-active div .bar-text .description').each(function(i, el) {
                            const hours = $(this).html();
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
