import { CommandContext } from "../models/command_context";

export interface Command {
  /**
   * List of aliases for the command.
   *
   * The first name in the list is the primary command name.
   */
  readonly commandNames: string[];

  /** Usage documentation. */
  getHelpMessage(commandPrefix: string): string;

  /** Execute the command. */
  run(parsedUserCommand: CommandContext, client: any): Promise<void>;
}
