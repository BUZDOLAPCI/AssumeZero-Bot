/*
    Handles reactions placed on messages in the chat, which the bot uses to
    record responses to events and take other actions on specific messages.
*/

const utils = require("./utils");
const config = require("./config");

exports.handleReacts = (message, info, api) => {
    const react = message.reaction;

    // handle reacts to other users' messages
    if (message.senderID !== config.bot.id && message.userID !== config.bot.id) {
        // handle reacts to other bot's messages
        switch (react) {
            case "👌":
            case "👍":
                return utils.voteUser(5, message, message.threadID, message.senderID, info, message.userID , api);
            case "❤️":
            case "❤":
            case "😍":
                return utils.voteUser(10, message, message.threadID, message.senderID, info, message.userID , api);
            case "👎":
                return utils.voteUser(-5, message, message.threadID, message.senderID, info, message.userID , api);
            case "😡":
            case "😠":
            case "🤬":
                return utils.voteUser(-10, message, message.threadID, message.senderID, info, message.userID , api);
        }
        return;  
    }
    else
    {
        // handle reacts to bot's messages
        switch (react) {
            case "👍":
            case "👎":
                return recordEventRSVP((react === "👍"), message, info, api);
            case "❌":
            case "🗑":
                return api.unsendMessage(message.messageID);
        }
    }
};

function recordEventRSVP(isGoing, message, info, api) {
    const eventMidMap = Object.keys(info.events).reduce((events, e) => {
        const event = info.events[e];
        events[event.mid] = event;
        return events;
    }, {});

    const event = eventMidMap[message.messageID];
    if (event) {
        const rsvpr = message.userID;
        api.getUserInfo(rsvpr, (err, uinfo) => {
            if (!err) {
                const data = uinfo[rsvpr];

                // Remove any pre-existing responses from that user
                event.going = event.going.filter(user => user.id != rsvpr);
                event.not_going = event.not_going.filter(user => user.id != rsvpr);

                const resp_list = isGoing ? event.going : event.not_going;
                resp_list.push({
                    "id": rsvpr,
                    "name": data.firstName
                });
                utils.setGroupProperty("events", info.events, info);
            }
        });
    }
}