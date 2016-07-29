const rp = require('request-promise');
const tidy = require('htmltidy2').tidy;
const cheerio = require('cheerio');
const Joi = require("joi");

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
                        .valid(['eu', 'us', 'kr', 'cn','global'])
                        .description('the region the user live is in for example: eu'),
                }
            },
            description: 'Check if the user owns a copy for another platform',
            notes: ' ',
        },
        handler: function(request, reply) {
            //https://playoverwatch.com/en-us/career/pc/eu/
            const tag = encodeURIComponent(request.params.tag);
            rp('https://playoverwatch.com/en-us/career/get-platforms/' + tag)
                .then(function(htmlString) {
                    const profile = JSON.parse(htmlString);
                    reply({ profile });
                })
                .catch(function(error) {
                    reply({ "statusCode": 520, error})
                });
        }
    });
    return next();
};


exports.register.attributes = {
    name: 'routes-get-platforms'
};
