"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreetCommand = void 0;
class GreetCommand {
    constructor() {
        this.commandNames = ["greet", "hello"];
    }
    getHelpMessage(commandPrefix) {
        return `Use ${commandPrefix}greet to get a greeting.`;
    }
    async run(parsedUserCommand) {
        await parsedUserCommand.originalMessage.reply("hello, world!");
    }
}
exports.GreetCommand = GreetCommand;
//# sourceMappingURL=greet.js.map