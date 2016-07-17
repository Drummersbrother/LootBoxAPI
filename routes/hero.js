const rp = require('request-promise');
const tidy = require('htmltidy2').tidy;
const cheerio = require('cheerio');
const Joi = require("joi");

exports.register = function(server, options, next) {
    server.route({
        method: 'GET',
        path: '/{platform}/{region}/{tag}/{mode}/hero/{hero}/',
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
                    hero: Joi.string()
                        .required()
                        .insensitive()
                        .description('the hero you want stats from'),
                    mode: Joi.string()
                        .required()
                        .insensitive()
                        .valid(['competitive-play', 'quick-play'])
                        .description('Either competitive-play or quick-play'),
                }
            },
            description: 'Get Stats for a specific hero.',
            notes: ' Changed hero names are: Torbjörn=Torbjoern,Lúcio=Lucio, Soldier: 76-=Soldier76',
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
                        let id;
                        /*
                   <option value="0x02E0000000000003">Tracer</option><option value="0x02E0000000000004">Mercy</option><option value="0x02E0000000000005">Hanzo</option><option value="0x02E0000000000006">Torbjörn</option><option value="0x02E0000000000007">Reinhardt</option><option value="0x02E0000000000008">Pharah</option><option value="0x02E0000000000009">Winston</option><option value="0x02E000000000000A">Widowmaker</option><option value="0x02E0000000000016">Symmetra</option><option value="0x02E0000000000020">Zenyatta</option><option value="0x02E0000000000029">Genji</option><option value="0x02E0000000000040">Roadhog</option><option value="0x02E0000000000042">McCree</option><option value="0x02E0000000000065">Junkrat</option><option value="0x02E0000000000068">Zarya</option><option value="0x02E0000000000079">Lúcio</option><option value="0x02E000000000007A">D.Va</option><option value="0x02E00000000000DD">Mei</option></select>
                     */

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
                            case "McCree":
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
                        //$('#stats-section div .row .toggle-display:nth-child(' + id + ') div').each(function(i, el) {
                        const hero_detail = {};

                        $('#'+mode+' .career-stats-section div .row .toggle-display[data-category-id="' + id + '"] div').each(function(i, el) {
                            //const hero_spefic = $(this).children('div:nth-child(1)').children('div').children('table').children('tbody').children('tr').each(function(i, el) {
                            $('#'+mode+' .career-stats-section div .row .toggle-display[data-category-id="' + id + '"] div:nth-child(' + i + ') .card-stat-block table tbody tr').each(function(i, el) {
                                const stats_name = $(this).children('td:nth-child(1)').html().replace(/ /g, '')
                                const stats_value = $(this).children('td:nth-child(2)').html().replace(/ /g, '')

                                hero_detail[stats_name] = stats_value;
                            });
                        });

                        reply(hero_detail);

                    });



                })
                .catch(function(err) {
                    reply({ "statusCode": 404, "error": "Found no user with the BattleTag: " + tag })
                });
        }
    });

    return next();
};


exports.register.attributes = {
    name: 'routes-hero'
};
