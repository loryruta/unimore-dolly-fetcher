const fetcher = require("./fetcher.js");
const subjects = require("./subjects.json");
const config = require("./config.json");

const broadcasts = [
    require("./broadcast/macca_website.js").broadcast
];

(async (subjects) => {
    // Fetch
    console.log("Fetching...");
    const fetchResult = await fetcher.fetchSubjects(config.username, config.password, subjects);

    // Broadcast
    console.log("Broadcasting...");
    await Promise.all(
        broadcasts.map(broadcast => broadcast(fetchResult))
    );

    console.log("Done");
})(subjects);
