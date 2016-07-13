const rp = require('request-promise');
const tidy = require('htmltidy2').tidy;
const cheerio = require('cheerio');
const Joi = require("joi");

exports.register = function(server, options, next) {
    server.route({
        method: 'GET',
        path: '/{platform}/{region}/{tag}/{mode}/allHeroes/',
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
                        .valid(['eu', 'na', 'kr', 'cn'])
                        .description('the region the user live is in for example: eu'),
                    mode: Joi.string()
                        .required()
                        .insensitive()
                        .valid(['competitive-play', 'quick-play'])
                        .description('Either competitive-play or quick-play'),
                }
            },
            description: 'Get Stats for a all heroes',
            notes: "Api is Case-sensitive !"
        },
        handler: function(request, reply) {
            //https://playoverwatch.com/en-us/career/pc/eu/
            const tag = encodeURIComponent(request.params.tag);
            const hero = encodeURIComponent(request.params.hero);
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
                        const obj = {};

                        $('#'+mode+' .career-stats-section div .row .toggle-display[data-category-id="0x02E00000FFFFFFFF"] div').each(function(i, el) {

                            $('#'+mode+' .career-stats-section div .row .toggle-display[data-category-id="0x02E00000FFFFFFFF"] div:nth-child(' + i + ') .card-stat-block table tbody tr').each(function(i, el) {

                                const stats_name = $(this).children('td:nth-child(1)').html().replace(/ /g, '');
                                const stats_value = $(this).children('td:nth-child(2)').html().replace(/ /g, '');

                                obj[stats_name] = stats_value;

                            });
                        });

                        reply(obj);

                    });
                }).catch(function(err) {
                    reply({ "statusCode": 404, "error": "Found no user with the BattleTag: " + tag })
                });
        }
    });
    return next();
};


exports.register.attributes = {
    name: 'routes-allHeroes'
};
