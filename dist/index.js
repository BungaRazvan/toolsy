"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("./config/config");
const command_handler_1 = require("./command_handler");
validateConfig(config_1.config);
const commandHandler = new command_handler_1.CommandHandler(config_1.config.prefix);
const client = new discord_js_1.Client({ disableMentions: "everyone" });
client.on("message", (message) => {
    commandHandler.handleMessage(message, client);
});
client.on("error", (e) => {
    console.error("Discord client error!", e);
});
client.on("ready", () => {
    console.log(`${client.user.username} is online`);
    client.user.setActivity(`a SEX TAPE`, {
        type: "WATCHING",
    });
});
client.login(config_1.config.token);
function validateConfig(config) {
    if (!config.token) {
        throw new Error("You need to specify your Discord bot token!");
    }
}
//# sourceMappingURL=index.js.map