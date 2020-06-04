import { Command } from "./command";
import { CommandContext } from "../models/command_context";
import { Op } from "sequelize";
import { Skins, Cases, Knives, Players, Inventory } from "../config/tables";
import {
  Players as IntPlayers,
  Inventory as IntInventory,
  CustomsSkins,
  GeneralObject,
} from "../config/interfaces";
import { MessageEmbed } from "discord.js";

export class OpenCommand implements Command {
  commandNames = ["open"];
  case: string = null;
  id: string = null;

  quality: GeneralObject = {
    Mil: 600,
    Restricted: 300,
    Classified: 150,
    Covert: 2,
    Knife: 1,
  };

  async run(commandContext: CommandContext): Promise<void> {
    this.id = commandContext.originalMessage.author.id;

    if (this.id === null) {
      await commandContext.originalMessage.reply(
        "Sorry something went wrong! Try again."
      );
    }

    if (commandContext.args.length !== 0) {
      this.case = commandContext.args.join(" ");
      const player = await this.getPlayer(this.id);
      const skin = await this.getSkin(this.case);

      if (!skin) {
        await commandContext.originalMessage.reply(
          "Sorry something went wrong! Maybe try another case."
        );
      } else {
        if (skin.skin_id) {
          await this.Inventory(player.id, skin.skin_id);
        } else {
          await this.Inventory(player.id, null, skin.knife_id);
        }

        const message = new MessageEmbed()
          .setTitle(skin.skin_name)
          .setDescription(`Rarity: ${skin.skin_quality}`)
          .attachFiles([skin.skin_image]);

        await commandContext.originalMessage.reply(message);
      }
    } else {
      await commandContext.originalMessage.reply(
        `Please choose what case to open. You can try ${commandContext.commandPrefix}cases to see a full list of cases.`
      );
    }
  }

  randomChance(input: GeneralObject): string {
    const array = [];
    for (let quality in input) {
      if (input.hasOwnProperty(quality)) {
        for (let i = 0; i < input[quality]; i++) {
          array.push(quality);
        }
      }
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  async createPlayer(id: string): Promise<IntPlayers> {
    return await Players.create({
      player_id: id,
    });
  }

  async createInventory(
    playerId: number,
    skinId: number = null,
    knifeId: number = null
  ): Promise<IntInventory> {
    return await Inventory.create({
      skin_id: skinId,
      player_id: playerId,
      knife_id: knifeId,
      quantity: 1,
    });
  }

  async Inventory(
    playerId: number,
    skinId: number = null,
    knifeId: number = null
  ): Promise<IntInventory> {
    let inv = await Inventory.findOne({
      where: {
        [Op.and]: [
          { player_id: playerId },
          { skin_id: skinId },
          { knife_id: knifeId },
        ],
      },
    });

    if (!inv) {
      this.createInventory(playerId, skinId, knifeId).then(
        (resp) => (inv = resp)
      );
    } else {
      this.updateInventory(inv);
    }

    return inv;
  }

  async updateInventory(inv: IntInventory): Promise<IntInventory> {
    return await Inventory.update(
      { quantity: inv.quantity + 1 },
      {
        where: {
          [Op.and]: [
            { player_id: inv.player_id },
            { skin_id: inv.skin_id },
            { knife_id: inv.knife_id },
          ],
        },
      }
    );
  }

  async getSkin(caseName: string): Promise<CustomsSkins> {
    const picked = this.randomChance(this.quality);
    let cases = null;
    let randomSkin = null;

    if (picked !== "Knife") {
      cases = await Cases.findOne({
        where: { case_name: caseName },
        include: [
          {
            model: Skins,
            where: { skin_quality: { [Op.like]: `%${picked}%` } },
          },
        ],
      });

      randomSkin = cases.skins[Math.floor(Math.random() * cases.skins.length)];
    } else {
      cases = await Cases.findOne({
        where: { case_name: caseName },
        include: [{ model: Knives }],
      });

      randomSkin =
        cases.knives[Math.floor(Math.random() * cases.knives.length)];
    }

    if (cases === null) {
      return null;
    }

    return randomSkin;
  }

  async getPlayer(id: string): Promise<IntPlayers> {
    let player = await Players.findOne({ where: { player_id: id } });

    if (!player) {
      this.createPlayer(id).then((resp) => (player = resp));
    }

    return player;
  }

  getHelpMessage(commandPrefix: string): string {
    return `Use ${commandPrefix}open followed by the case name to open.`;
  }
}
