"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandler = void 0;
const command_context_1 = require("./models/command_context");
const greet_1 = require("./commands/greet");
const help_1 = require("./commands/help");
const open_1 = require("./commands/open");
class CommandHandler {
    constructor(prefix) {
        const commandClasses = [greet_1.GreetCommand, open_1.OpenCommand];
        this.commands = commandClasses.map((commandClass) => new commandClass());
        this.commands.push(new help_1.HelpCommand(this.commands));
        this.prefix = prefix;
    }
    async handleMessage(message, client) {
        if (message.author.bot ||
            !this.isCommand(message) ||
            message.channel.type === "dm") {
            return;
        }
        const commandContext = new command_context_1.CommandContext(message, this.prefix);
        const matchedCommand = this.commands.find((command) => command.commandNames.includes(commandContext.parsedCommandName));
        if (!matchedCommand) {
            await message.reply(`I don't recognize that command. Try !help.`);
        }
        else {
            await matchedCommand.run(commandContext, client);
        }
    }
    /** Determines whether or not a message is a user command. */
    isCommand(message) {
        return message.content.startsWith(this.prefix);
    }
}
exports.CommandHandler = CommandHandler;
//# sourceMappingURL=command_handler.js.map