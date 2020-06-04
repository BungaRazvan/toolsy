const { MessageEmbed } = require("discord.js");
const colors = require("../json/colors.json");

const { Op } = require("sequelize");
const {
  Skins,
  Knives,
  Cases,
  Players,
  Inventory,
} = require("../skins/sql/tables.js");

module.exports.run = async (bot, message, args) => {
  const authorId = message.author.id;
  let container = args.join(" ");

  const quality = {
    Mil: 600,
    Restricted: 300,
    Classified: 150,
    Covert: 2,
    Knife: 1,
  };

  let Player = await Players.findOne({ where: { player_id: authorId } });

  if (!Player) {
    await Players.create({ player_id: authorId });
    Player = await Players.findOne({ where: { player_id: authorId } });
  }

  function get(input) {
    var array = [];
    for (var quality in input) {
      if (input.hasOwnProperty(quality)) {
        for (var i = 0; i < input[quality]; i++) {
          array.push(quality);
        }
      }
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  if (container) {
    const picked = get(quality);

    if (picked !== "Knife") {
      const cases = await Cases.findOne({
        where: { case_name: container },
        include: {
          model: Skins,
          where: { skin_quality: { [Op.like]: `%${picked}%` } },
        },
      });

      if (!cases) {
        message.channel.send("No skins!! Work in progress!!");
      } else {
        const randomSkin =
          cases.skins[Math.floor(Math.random() * cases.skins.length)];

        const entry = await Inventory.findOne({
          where: {
            [Op.and]: [
              { player_id: Player.id },
              { skin_id: randomSkin.skin_id },
            ],
          },
        });

        if (!entry) {
          await Inventory.create({
            skin_id: randomSkin.skin_id,
            player_id: Player.id,
            quantity: 1,
          });
        } else {
          await Inventory.update(
            { quantity: entry.quantity + 1 },
            {
              where: {
                [Op.and]: [
                  { player_id: Player.id },
                  { skin_id: randomSkin.skin_id },
                ],
              },
            }
          );
        }

        message.channel.send(`${message.author} `, {
          files: [`${randomSkin.skin_image}`],
        });
      }
    } else {
      const cases = await Cases.findOne({
        where: { case_name: container },
        include: {
          model: Knives,
        },
      });

      if (!cases) {
        message.channel.send("No skins!! Work in progress!!");
      } else {
        const randomSkin =
          cases.knives[Math.floor(Math.random() * cases.knives.length)];

        const entry = await Inventory.findOne({
          where: {
            [Op.and]: [
              { player_id: Player.id },
              { knife_id: randomSkin.knife_id },
            ],
          },
        });

        if (!entry) {
          await Inventory.create({
            knife_id: randomSkin.knife_id,
            player_id: Player.id,
            quantity: 1,
          });
        } else {
          await Inventory.update(
            { quantity: entry.quantity + 1 },
            {
              where: {
                [Op.and]: [
                  { player_id: Player.id },
                  { knife_id: randomSkin.knife_id },
                ],
              },
            }
          );
        }
        const skinEmbed = new MessageEmbed()
          .setTitle(randomSkin.skin_name)
          .setColor(colors.red)
          .attachFiles([randomSkin.knife_image]);

        console.log(randomSkin.knife_image);
        message.channel.send(`${message.author} `, skinEmbed);
      }
    }
  } else {
    message.channel.send("You have to specifie a case");
  }
};

module.exports.config = {
  name: "open",
  description: "Open a case",
  usage: "!open case_name",
};
