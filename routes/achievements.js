const rp = require('request-promise');
const cheerio = require('cheerio');
const Joi = require("joi");



const getAchievements = function(tag, region, platform, next) {
    let url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + region + '/' + tag;


    if (platform == "psn" || platform == "xbl" && region == "global") {
        url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + tag;
    }

    rp(url)
        .then(function(htmlString) {

            const $ = cheerio.load(htmlString, { xmlMode: true });
            const achievements = [];
            let enabledCount = 0;


            $('#achievements-section .toggle-display .media-card').each(function(i, el) {

                const image = $(this).children("img").attr("src");//media-card-caption
                const title = $(this).children(".media-card-caption").children(".media-card-title").html();
                const achievementDescription = $(this).parent().children("#" + $(this).attr("data-tooltip")).children("p").html();
                const category = $(this).parent().parent().parent().parent().parent().children(".js-career-select").children("option[value='" + $(this).parent().parent().parent().attr("data-category-id") + "']").html();
                const finished = $(this).hasClass('m-disabled');

                if (finished == false) {
                    achievements.push({ name: title, finished: true, image: image, description: achievementDescription, category: category });
                    enabledCount++;
                } else {
                    achievements.push({ name: title, finished: false, image: image, description: achievementDescription, category: category });
                }

            });
            const allAchievements = $('#achievements-section .toggle-display .media-card').length;

             return next(null,JSON.stringify({ totalNumberOfAchievements: allAchievements, numberOfAchievementsCompleted: enabledCount, finishedAchievements: enabledCount + "/" + allAchievements, achievements: achievements }));
        }).catch(function(err) {
             return next(null,{ "statusCode": 404, "error": "Found no user with the BattleTag: " + tag })
        });
}


exports.register = function(server, options, next) {


    server.method('getAchievements', getAchievements, {
        cache: {
            cache: 'mongo',
            expiresIn: 6 * 10000, // 10 minutes
            generateTimeout: 40000,
            staleTimeout: 10000,
            staleIn: 20000,

        }
    });

    server.route({
        method: 'GET',
        path: '/{platform}/{region}/{tag}/achievements',

        config: {
            tags: ['api'],
            validate: {
                params: {
                    tag: Joi.string()
                        .required()
                        .regex(/^(?:[a-zA-Z\u00C0-\u017F0-9]{3,12}-[0-9]{4,},)?(?:[a-zA-Z\u00C0-\u017F0-9]{3,12}-[0-9]{4,})$/g)
                        .description('the battle-tag of the user | "#" should be replaced by an "-"'),
                    platform: Joi.string()
                        .required()
                        .insensitive()
                        .valid(['pc', 'xbl', 'psn'])
                        .description('the platform that the user use: pc,xbl,psn'),
                    region: Joi.string()
                        .required()
                        .insensitive()
                        .valid(['eu', 'us', 'kr', 'cn', 'global'])
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

            server.methods.getAchievements(tag, region, platform, (err, result) => {
                if (err) {
                    return reply(err);
                }

                reply(result);
            });

        }
    });
    return next();
};


exports.register.attributes = {
    name: 'routes-achievements'
};
