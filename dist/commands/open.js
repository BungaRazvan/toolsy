"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenCommand = void 0;
const sequelize_1 = require("sequelize");
const tables_1 = require("../config/tables");
const discord_js_1 = require("discord.js");
class OpenCommand {
    constructor() {
        this.commandNames = ["open"];
        this.case = null;
        this.id = null;
        this.quality = {
            Mil: 600,
            Restricted: 300,
            Classified: 150,
            Covert: 2,
            Knife: 1,
        };
    }
    async run(commandContext) {
        this.id = commandContext.originalMessage.author.id;
        if (this.id === null) {
            await commandContext.originalMessage.reply("Sorry something went wrong! Try again.");
        }
        if (commandContext.args.length !== 0) {
            this.case = commandContext.args.join(" ");
            const player = await this.getPlayer(this.id);
            const skin = await this.getSkin(this.case);
            if (!skin) {
                await commandContext.originalMessage.reply("Sorry something went wrong! Maybe try another case.");
            }
            else {
                if (skin.skin_id) {
                    await this.Inventory(player.id, skin.skin_id);
                }
                else {
                    await this.Inventory(player.id, null, skin.knife_id);
                }
                const message = new discord_js_1.MessageEmbed()
                    .setTitle(skin.skin_name)
                    .setDescription(`Rarity: ${skin.skin_quality}`)
                    .attachFiles([skin.skin_image]);
                await commandContext.originalMessage.reply(message);
            }
        }
        else {
            await commandContext.originalMessage.reply(`Please choose what case to open. You can try ${commandContext.commandPrefix}cases to see a full list of cases.`);
        }
    }
    randomChance(input) {
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
    async createPlayer(id) {
        return await tables_1.Players.create({
            player_id: id,
        });
    }
    async createInventory(playerId, skinId = null, knifeId = null) {
        return await tables_1.Inventory.create({
            skin_id: skinId,
            player_id: playerId,
            knife_id: knifeId,
            quantity: 1,
        });
    }
    async Inventory(playerId, skinId = null, knifeId = null) {
        let inv = await tables_1.Inventory.findOne({
            where: {
                [sequelize_1.Op.and]: [
                    { player_id: playerId },
                    { skin_id: skinId },
                    { knife_id: knifeId },
                ],
            },
        });
        if (!inv) {
            this.createInventory(playerId, skinId, knifeId).then((resp) => (inv = resp));
        }
        else {
            this.updateInventory(inv);
        }
        return inv;
    }
    async updateInventory(inv) {
        return await tables_1.Inventory.update({ quantity: inv.quantity + 1 }, {
            where: {
                [sequelize_1.Op.and]: [
                    { player_id: inv.player_id },
                    { skin_id: inv.skin_id },
                    { knife_id: inv.knife_id },
                ],
            },
        });
    }
    async getSkin(caseName) {
        const picked = this.randomChance(this.quality);
        let cases = null;
        let randomSkin = null;
        if (picked !== "Knife") {
            cases = await tables_1.Cases.findOne({
                where: { case_name: caseName },
                include: [
                    {
                        model: tables_1.Skins,
                        where: { skin_quality: { [sequelize_1.Op.like]: `%${picked}%` } },
                    },
                ],
            });
            randomSkin = cases.skins[Math.floor(Math.random() * cases.skins.length)];
        }
        else {
            cases = await tables_1.Cases.findOne({
                where: { case_name: caseName },
                include: [{ model: tables_1.Knives }],
            });
            randomSkin =
                cases.knives[Math.floor(Math.random() * cases.knives.length)];
        }
        if (cases === null) {
            return null;
        }
        return randomSkin;
    }
    async getPlayer(id) {
        let player = await tables_1.Players.findOne({ where: { player_id: id } });
        if (!player) {
            this.createPlayer(id).then((resp) => (player = resp));
        }
        return player;
    }
    getHelpMessage(commandPrefix) {
        return `Use ${commandPrefix}open followed by the case name to open.`;
    }
}
exports.OpenCommand = OpenCommand;
//# sourceMappingURL=open.js.map