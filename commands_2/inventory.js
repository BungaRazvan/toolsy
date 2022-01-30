const { MessageEmbed } = require("discord.js");

const { Skins, Knives, Players, Inventory } = require("../skins/sql/tables.js");

module.exports.run = async (bot, message, args) => {
  const authorId = message.author.id;

  let Player = await Players.findOne({ where: { player_id: authorId } });

  if (!Player) {
    message.channel.send("Sorry you dont have a inventory");
  } else {
    const skins = await Inventory.findAll({
      where: { player_id: Player.id },
      include: [Skins, Knives],
    });

    let skinsImages = [];
    let knivesImages = [];

    if (skins.length > 0) {
      skins.map((skin) => {
        skinsImages.push(skin.skin.skin_image);
      });
    }

    if (knives.length > 0) {
      skins.map((knives) => {
        knivesImages.push(knives.knives.knife_image);
      });
    }

    const exampleEmbed = new MessageEmbed()
      .setTitle(`Invetory of ${message.author.username}`)
      .attachFiles(skinsImages);

    message.channel.send(exampleEmbed);
  }
};

module.exports.config = {
  name: "inventory",
  description: "Shows you inventory",
  usage: "!inventory",
};
