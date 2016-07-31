const rp = require('request-promise');
const cheerio = require('cheerio');
const Joi = require("joi");

const getProfile = function(tag, region, platform, next) {

    let url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + region + '/' + tag;


    if (platform == "psn" || platform == "xbl" && region == "global") {
        url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + tag;
    }

    rp(url)
        .then(function(htmlString) {

            const $ = cheerio.load(htmlString);
            const username = $('.header-masthead').text();
            const picture = $('.header-masthead').text();

            const games_won = {};
            const games_played = {};
            const timeplayed = {};
            const lost = {}
            let competitive_rank = undefined;
            let competitive_rank_img = undefined;
            let star = "";


            const quick_games_won_elm = $('#quick-play td:contains("Games Won")').next().html()
            const quick_games_played_elm = $('#quick-play td:contains("Games Played")').next().html()
            const quick_timeplayed_elm = $('#quick-play td:contains("Time Played")').next().html()

            const comp_games_won_elm = $('#competitive-play td:contains("Games Won")').next().html()
            const comp_games_played_elm = $('#competitive-play td:contains("Games Played")').next().html()
            const comp_timeplayed_elm = $('#competitive-play td:contains("Time Played")').next().html()

            const competitive_rank_elm = $('.competitive-rank');

            const level_frame = $('.player-level').attr("style").slice(21, 109);

            const star_elm = $('.player-level .player-rank').html();


            if (competitive_rank_elm != null) {
                competitive_rank_img = $('.competitive-rank img').attr("src")
                competitive_rank = $('.competitive-rank div').html()
            }

            if (quick_games_won_elm != null) {
                games_won.quick = quick_games_won_elm.trim().replace(/,/g, '');
            }

            if (quick_games_played_elm != null) {
                games_played.quick = quick_games_played_elm.trim().replace(/,/g, '');
                lost.quick = games_played.quick - games_won.quick;
            }

            if (quick_timeplayed_elm != null) {
                timeplayed.quick = quick_timeplayed_elm.trim().replace(/,/g, '');
            }

            if (comp_games_won_elm != null) {
                games_won.comp = comp_games_won_elm.trim().replace(/,/g, '');
            }

            if (comp_games_played_elm != null) {
                games_played.comp = comp_games_played_elm.trim().replace(/,/g, '');
                lost.comp = games_played.comp - games_won.comp;
            }

            if (comp_timeplayed_elm != null) {
                timeplayed.comp = comp_timeplayed_elm.trim().replace(/,/g, '');
            }


            if (comp_timeplayed_elm != null) {
                timeplayed.comp = comp_timeplayed_elm.trim().replace(/,/g, '');
            }

            if (star_elm != null) {
                star = $('.player-level .player-rank').attr("style").slice(21, 107);
            }




            /*let Win_Ratio = games_won / games_played;
            let percentage = Math.round((Win_Ratio * 100)).toFixed(1);*/

            //https://playoverwatch.com/en-us/search/account-by-name/tag
            rp('https://playoverwatch.com/en-us/search/account-by-name/' + tag)
                .then(function(htmlString) {
                    const profiles = JSON.parse(htmlString);
                    let profile = undefined;



                    let searchString;

                    if (platform == "pc") {
                        searchString = "/career/" + platform + "/" + region + "/" + decodeURI(tag);
                    } else {
                        searchString = "/career/" + platform + "/" + decodeURI(tag);
                    }


                    for (let i = 0; i < profiles.length; i++) {
                        if (profiles[i].careerLink == searchString) profile = profiles[i]
                    }
                    return next(null, {
                        data: { username: username, level: profile.level, games: { quick: { wins: games_won.quick, lost: lost.quick, played: games_played.quick }, competitive: { wins: games_won.comp, lost: lost.comp, played: games_played.comp } }, playtime: { quick: timeplayed.quick, competitive: timeplayed.comp }, avatar: profile.portrait, competitive: { rank: competitive_rank, rank_img: competitive_rank_img }, levelFrame: level_frame, star: star }
                    });

                })
        }).catch(function(err) {
            console.log(err)
            return next(null, { "statusCode": 404, "error": "Found no user with the BattleTag: " + tag })
        });

};



exports.register = function(server, options, next) {

    server.method('getProfile', getProfile, {
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
        path: '/{platform}/{region}/{tag}/profile',
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
            description: 'Get Stats for a specific hero',
            notes: ' ',
        },
        handler: function(request, reply) {

            const tag = encodeURIComponent(request.params.tag);
            const region = encodeURIComponent(request.params.region);
            const platform = encodeURIComponent(request.params.platform);

            server.methods.getProfile(tag, region, platform, (err, result) => {
                if (err) {
                    return reply(err);
                }

                reply(result);
            });


        }
    })


    return next();
}

exports.register.attributes = {
    name: 'routes-profile'
};
