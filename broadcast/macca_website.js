const config = require("../config.json");
const rp = require("request-promise");

exports.broadcast = async function(fetchResult) {
    await rp({
        method: "post",
        uri: 'https://bot.emilianomaccaferri.com/courses',
        resolveWithFullResponse: true,
        body: {
            key: config.maccaWebsite.key,
            result: fetchResult
        },
        json: true
    });
};


