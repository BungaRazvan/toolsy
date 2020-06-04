import { Message } from "discord.js";
import { Command } from "./commands/command";
import { CommandContext } from "./models/command_context";
import { GreetCommand } from "./commands/greet";
import { HelpCommand } from "./commands/help";
import { OpenCommand } from "./commands/open";

export class CommandHandler {
  private commands: Command[];

  private readonly prefix: string;

  constructor(prefix: string) {
    const commandClasses = [GreetCommand, OpenCommand];

    this.commands = commandClasses.map((commandClass) => new commandClass());
    this.commands.push(new HelpCommand(this.commands));

    this.prefix = prefix;
  }

  async handleMessage(message: Message, client: any): Promise<void> {
    if (
      message.author.bot ||
      !this.isCommand(message) ||
      message.channel.type === "dm"
    ) {
      return;
    }

    const commandContext = new CommandContext(message, this.prefix);

    const matchedCommand = this.commands.find((command) =>
      command.commandNames.includes(commandContext.parsedCommandName)
    );

    if (!matchedCommand) {
      await message.reply(`I don't recognize that command. Try !help.`);
    } else {
      await matchedCommand.run(commandContext, client);
    }
  }

  /** Determines whether or not a message is a user command. */
  private isCommand(message: Message): boolean {
    return message.content.startsWith(this.prefix);
  }
}
