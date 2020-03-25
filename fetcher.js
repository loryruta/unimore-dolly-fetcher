const cheerio = require("cheerio");
const rp = require("request-promise").defaults({
    jar: true
});
const parseURL = require("url").parse;

// https://github.com/emilianomaccaferri/unimore-inginfo-bot/blob/master/lib/Scraper.js#L127
async function auth(username, password) {
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
            j_username: username,
            j_password: password,
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

async function parseMaterial($, element) {
    const name = element.find(".instancename").text();
    const link = (
        await rp({
            method: "get",
            url: element.find("a").attr("href") + "&redirect=1",
            resolveWithFullResponse: true,
        })
    ).request.href;
    return {
        name: name.replace(" URL", ""), // TODO
        link: link
    };
}

async function parseSection($, element) {
    const name = element.find(".sectionname > span > a").text();
    const materials = await Promise.all(
        element.find("ul").children().toArray().map(child => {
            return parseMaterial(
                $,
                $(child).find(".activityinstance")
            );
        })
    );
    return {
        name: name,
        materials: materials
    }
}

async function parseSections($, sections) {
    return await Promise.all(sections.map(
        id => {
            return parseSection(
                $,
                $(`#section-${id} div.content`)
            );
        }
    ))
}

async function fetchSubject(subject) {
    const response = await rp({
        method: "get",
        url: subject.dolly.page,
        resolveWithFullResponse: true,
    });
    const $ = cheerio.load(response.body);
    return {
        name: subject.name,
        sections: await parseSections(
            $,
            subject.dolly.sections
        )
    };
}

async function fetchSubjects(username, password, subjects) {
    await auth(username, password);
    return await Promise.all(
        subjects.map(subject => fetchSubject(subject))
    );
}

exports.fetchSubjects = fetchSubjects;
