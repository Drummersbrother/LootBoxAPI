const rp = require('request-promise');
const cheerio = require('cheerio');
const Joi = require("joi");

const getHeroes = function(tag, region, platform, mode, heroesStr, next) {
    let url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + region + '/' + tag;
    if (platform == "psn" || platform == "xbl" && region == "global") {
        url = 'https://playoverwatch.com/en-us/career/' + platform + '/' + tag;
    }


    rp(url)
        .then(function(htmlString) {


            const $ = cheerio.load(htmlString);
            const heroes_detail = {};

            (function() {
                let heroIds = [];
                const heroes = heroesStr.split("%2C");
                //  const heroes = ["Reaper","Tracer","Mercy","Hanzo","Torbjoern","Reinhardt","Pharah","Winston","Widowmaker","Bastion","Symmetra","Zenyatta","Genji",
                //                  "Roadhog","Mccree","Junkrat","Zarya","Soldier76","Lucio","DVa","Mei"];
                heroes.forEach(hero => {
                    let id;
                    switch (hero) {
                        case "Reaper":
                            id = "0x02E0000000000002";
                            break;
                        case "Tracer":
                            id = "0x02E0000000000003";
                            break;
                        case "Mercy":
                            id = "0x02E0000000000004";
                            break;
                        case "Hanzo":
                            id = "0x02E0000000000005";
                            break;
                        case "Torbjoern":
                            id = "0x02E0000000000006";
                            break;
                        case "Reinhardt":
                            id = "0x02E0000000000007";
                            break;
                        case "Pharah":
                            id = "0x02E0000000000008";
                            break;
                        case "Winston":
                            id = "0x02E0000000000009";
                            break;
                        case "Widowmaker":
                            id = "0x02E000000000000A";
                            break;
                        case "Bastion":
                            id = "0x02E0000000000015";
                            break;
                        case "Symmetra":
                            id = "0x02E0000000000016";
                            break;
                        case "Zenyatta":
                            id = "0x02E0000000000020";
                            break;
                        case "Genji":
                            id = "0x02E0000000000029";
                            break;
                        case "Roadhog":
                            id = "0x02E0000000000040";
                            break;
                        case "Mccree":
                            id = "0x02E0000000000042";
                            break;
                        case "Junkrat":
                            id = "0x02E0000000000065";
                            break;
                        case "Zarya":
                            id = "0x02E0000000000068";
                            break;
                        case "Soldier76":
                            id = "0x02E000000000006E";
                            break;
                        case "Lucio":
                            id = "0x02E0000000000079";
                            break;
                        case "DVa":
                            id = "0x02E000000000007A";
                            break;
                        case "Mei":
                            id = "0x02E00000000000DD";
                            break;
                    }
                    heroIds.push({
                        id: id,
                        name: hero
                    });
                });
                //$('#stats-section div .row .toggle-display:nth-child(' + id + ') div').each(function(i, el) {

                const $row = $('body > div > .profile-background > ' + '#' + mode + ' > .career-stats-section > div ');

                heroIds.forEach(hero => {
                    let id = hero.id;
                    let name = hero.name;
                    const hero_detail = {};
                    $row.children('.row[data-category-id="' + id + '"]').children('div').each(function(i, el) {
                        $(el).children('.card-stat-block').find('table > tbody > tr').each(function(i, el) {
                            const stats_name = $(this).children('td:nth-child(1)').html().replace(/ /g, '')
                            const stats_value = $(this).children('td:nth-child(2)').html().replace(/ /g, '')

                            hero_detail[stats_name] = stats_value;

                        });
                    });
                    heroes_detail[name] = hero_detail;
                });

            }());

            return next(null,heroes_detail);

        })



    .catch(function(err) {
        console.log(err)
        return next(null,{ "statusCode": 404, "error": "Found no user with the BattleTag: " + tag })
    });
}



exports.register = function(server, options, next) {

    server.method('getHeroes', getHeroes, {
        cache: {
            cache: 'mongo',
            expiresIn: 6 * 10000, // 10 minutes
            generateTimeout: 40000,
            staleTimeout: 10000,
            staleIn: 20000,

        },

    });

    server.route({
        method: 'GET',
        path: '/{platform}/{region}/{tag}/{mode}/hero/{heroes}/',
        config: {
            tags: ['api'],
            validate: {
                params: {
                    tag: Joi.string()
                        .required()
                        .regex(/^(?:[a-zA-Z\\u00C0-\\u017F0-9]{3,12}-[0-9]{4,},)?(?:[a-zA-Z\\u00C0-\\u017F0-9]{3,12}-[0-9]{4,})$/g)
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
                    heroes: Joi.string()
                        .required()
                        .insensitive()
                        .description('heroes you want stats from'),
                    mode: Joi.string()
                        .required()
                        .insensitive()
                        .valid(['competitive-play', 'quick-play'])
                        .description('Either competitive-play or quick-play'),
                }
            },
            description: 'Get Stats for multiple heroes.',
            notes: ' Changed hero names are: Torbjörn=Torbjoern,Lúcio=Lucio, Soldier: 76-=Soldier76',
        },
        handler: function(request, reply) {
            //https://playoverwatch.com/en-us/career/pc/eu/
            const tag = encodeURIComponent(request.params.tag);
            const region = encodeURIComponent(request.params.region);
            const platform = encodeURIComponent(request.params.platform);
            const mode = encodeURIComponent(request.params.mode);
            const heroes =encodeURIComponent(request.params.heroes);

            server.methods.getHeroes(tag, region, platform, mode, heroes, (err, result) => {
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
    name: 'routes-hero'
};
