const fetcher = require("./fetcher.js");
const Telegraf = require("telegraf");
const subjects = require("./subjects.json");
const config = require("./config.json");

const bot = new Telegraf(config.bot.token);

async function fetch(subjects) {
    // Authenticates to Dolly.
    await fetcher.auth(config);

    // Fetches all the lessons in parallel and gathers them in a single list.
    let fetchers = [];

    console.log("Creating fetchers for " + subjects.length + " subjects...");
    for (const subject of subjects) {
        fetchers.push(
            fetcher.fetch(subject)
                .then(sections => {
                    return {
                        ...subject,
                        sections: sections
                    };
                })
        );
    }

    console.log("Fetching from Dolly...");
    const results = await Promise.all(fetchers);

    // Constructs the channel message that will be visualized by the users.
    console.log("Constructing broadcast message...");
    let message = "";

    // subjects
    for (const result of results) {
        message += `<b>${result.name.toUpperCase()}</b>\n`;
        message += `\n`;
        // sections
        for (const section of result.sections) {
            message += `<b>${section.name}</b>\n`;
            // lessons
            for (const lesson of section.lessons) {
                const lessonString = `<a href="${lesson.link}">${lesson.name}</a>`;
                message += `• ${lessonString}\n`;
            }
            message += `\n`;
        }
    }

    console.log("Broadcasting...");
    await bot.telegram.sendMessage(config.bot.channelId, message, {parse_mode: "HTML"});
}

fetch(subjects);
