"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpCommand = void 0;
const discord_js_1 = require("discord.js");
class HelpCommand {
    constructor(commands) {
        this.commandNames = ["help", "h"];
        this.commands = commands;
    }
    async run(commandContext, client) {
        const HelpCommandEmbed = new discord_js_1.MessageEmbed()
            .setThumbnail(commandContext.originalMessage.guild.iconURL())
            .setColor("#0099ff")
            .setFooter(`${client.user.username}`, `${client.user.displayAvatarURL()}`);
        if (commandContext.args.length === 0) {
            const commandNames = this.commands.map((command) => command.commandNames[0]);
            HelpCommandEmbed.setDescription(`Here is a list of commands you can run: `);
            commandNames.map((commandName) => {
                const usage = this.commands.find((command) => command.commandNames.includes(commandName));
                HelpCommandEmbed.addField("**Command**: ", `${commandContext.commandPrefix}${commandName}`).addField("**Usage**:", `${this.buildHelpMessageForCommand(usage, commandContext)}`);
            });
            await commandContext.originalMessage.reply(HelpCommandEmbed);
            return;
        }
        const matchedCommand = this.commands.find((command) => command.commandNames.includes(commandContext.args[0]));
        if (!matchedCommand) {
            await commandContext.originalMessage.reply("I don't know about that command :(. Try !help to find all commands you can use.");
            return Promise.reject("Unrecognized command");
        }
        else {
            HelpCommandEmbed.addField("**Usage**: ", `${this.buildHelpMessageForCommand(matchedCommand, commandContext)}`);
            await commandContext.originalMessage.reply(HelpCommandEmbed);
        }
    }
    buildHelpMessageForCommand(command, context) {
        return `${command.getHelpMessage(context.commandPrefix)}`;
    }
    getHelpMessage(commandPrefix) {
        return "I think you already know how to use this command...";
    }
}
exports.HelpCommand = HelpCommand;
//# sourceMappingURL=help.js.map