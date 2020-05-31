const { Client, RichEmbed } = require("discord.js");
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
      cases = await Cases.findOne({
        where: { case_name: container },
        include: {
          model: Skins,
          where: { skin_quality: { [Op.like]: `%${picked}%` } },
        },
      });

      const randomSkin =
        cases.skins[Math.floor(Math.random() * cases.skins.length)].skin_image;

      message.channel.send(`${message.author} `, { files: [`${randomSkin}`] });
    } else {
      cases = await Cases.findOne({
        where: { case_name: container },
        include: {
          model: Knives,
        },
      });

      const randomSkin =
        cases.knives[Math.floor(Math.random() * cases.knives.length)]
          .knife_image;

      message.channel.send(`${message.author} `, { files: randomSkin });
    }

    if (!cases) {
      message.channel.send("No skins!! Work in progress!!");
    }
  } else {
    message.channel.send("You have to specifie a case");
  }
};

module.exports.config = {
  name: "open",
  description: "Open a case",
  usage: "!open",
};
