const { Client, RichEmbed } = require("discord.js");
const colors = require("../json/colors.json");
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

  if (container) {
    cases = await Cases.findOne({
      where: { case_name: container },
      include: [Skins, Knives],
    });

    if (!cases) {
      message.channel.send("No skins!! Work in progress!!");
    }

    const randomSkin =
      cases.skins[Math.floor(Math.random() * cases.skins.length)].skin_image;

    console.log(randomSkin);
    const attachment = new RichEmbed().setThumbnail(`${randomSkin}`);

    message.channel.send(`${message.author} ${randomSkin}`);
  } else {
    message.channel.send("You have to specifie a case");
  }
};

module.exports.config = {
  name: "open",
  description: "Open a case",
  usage: "!open",
};

//   file: cases.skins[Math.floor(Math.random() * cases.skins.length)],
