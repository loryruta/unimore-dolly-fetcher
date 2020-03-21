const cheerio = require("cheerio");
const rp = require("request-promise").defaults({
    jar: true
});
const parseURL = require("url").parse;

// https://github.com/emilianomaccaferri/unimore-inginfo-bot/blob/master/lib/Scraper.js#L127
async function auth(config) {
    let response;

    response = await rp({
        method: "get",
        uri: "https://dolly.ingmo.unimore.it/2019/auth/shibboleth/index.php",
        resolveWithFullResponse: true,
    });

    response = await rp({
        method: "post",
        uri: response.request.href,
        resolveWithFullResponse: true,
        form: {
            j_username: config.username,
            j_password: config.password,
            _eventId_proceed: ''
        },
    });

    const $ = cheerio.load(response.body);
    response = await rp({
        method: "post",
        uri: 'https://dolly.ingmo.unimore.it/Shibboleth.sso/SAML2/POST',
        resolveWithFullResponse: true,
        form: {
            SAMLResponse: $('input[name^="SAMLResponse"]').val(),
            RelayState: $('input[name^="RelayState"]').val()
        }
    });

    return response;
}

async function fetch(subject) {
    const url = subject.dolly.page;
    const response = await rp({
        method: "get",
        url: url,
        resolveWithFullResponse: true,
    });

    let sections = [];

    const $ = cheerio.load(response.body);
    for (const sectionId of subject.dolly.sections) {
        const sectionElement = $(`#section-${sectionId} div.content`);

        let lessons = [];
        for (const child of sectionElement.find("ul").children().toArray()) {
            const fileElement = $(child).find(".activityinstance");
            const name = fileElement.find(".instancename").text();
            const link = (
                await rp({
                    method: "get",
                    url: fileElement.find("a").attr("href") + "&redirect=1",
                    resolveWithFullResponse: true,
                })
            ).request.href;

            lessons.push({
                name: name.replace(" URL", ""), // TODO
                link: link
            });
        }

        sections.push({
            name: sectionElement.find(".sectionname > span > a").text(),
            lessons: lessons
        });
    }

    return sections;
}

exports.auth = auth;
exports.fetch = fetch;

