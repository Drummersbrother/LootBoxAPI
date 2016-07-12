const rp = require('request-promise');
const tidy = require('htmltidy2').tidy;
const cheerio = require('cheerio');
const Joi = require("joi");

exports.register = function(server, options, next) {
    server.route({
        method: 'GET',
        path: '/{platform}/{region}/{tag}/achievements',

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
            description: 'Get the users achievements',
            notes: "Api is Case-sensitive !"
        },
        handler: function(request, reply) {
            //https://playoverwatch.com/en-us/career/pc/eu/
            const tag = encodeURIComponent(request.params.tag);
            const region = encodeURIComponent(request.params.region);
            const platform = encodeURIComponent(request.params.platform);
            let url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + region + '/' + tag;


            if (platform == "psn" || platform == "xbl" && region == "global") {
                url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + tag;
            }

            rp(url)
                .then(function(htmlString) {
                    tidy(htmlString, function(err, html) {

                        const $ = cheerio.load(htmlString, { xmlMode: true });
                        const achievements = [];
                        let enabledCount = 0;


                        $('#achievements-section .toggle-display .media-card').each(function(i, el) {

                            const image = $(this).children(".container").children("img").attr("src");
                            const title = $(this).children(".container").children(".content").html();
                            const finished = $(this).hasClass('m-disabled');

                            if (finished == false) {
                                achievements.push({ name: title, finished: true, image: image });
                                enabledCount++;
                            } else {
                                achievements.push({ name: title, finished: false, image: image });
                            }

                        });
                        const allAchievements = $('#achievements-section .toggle-display .media-card').length;

                        reply(JSON.stringify({ finishedAchievements: enabledCount + "/" + allAchievements, achievements: achievements }));
                    });

                })
                .catch(function(err) {
                    reply({ "statusCode": 404, "error": "Found no user with the BattleTag: "+tag })
                });
        }
    });
    return next();
};


exports.register.attributes = {
    name: 'routes-achievements'
};
