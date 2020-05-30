const { Client, RichEmbed } = require("discord.js");
const axios = require("axios");
const colors = require("../json/colors.json");

module.exports.run = async (bot, message, args) => {
  if (args[0] && !args[1]) {
    const coin = args[0].toUpperCase();

    axios
      .get(
        `https://min-api.cryptocompare.com/data/price?fsym=${coin}&tsyms=BTC,USD,EUR`
      )
      .then((res) => {
        let cryptosUSD = res.data.USD;
        let cryptosEUR = res.data.EUR;
        let cryptosBTC = res.data.BTC;

        const coinEmbed = new RichEmbed()
          .setColor(colors.orange)
          .addField("Cryptocurrency: ", coin)
          .setThumbnail(`https://cryptoicons.org/api/icon/${args[0]}/100`)
          .addField(`One ${coin} has the price of:`, `${cryptosEUR} EUR`)
          .addField(`One ${coin} has the price of:`, `${cryptosUSD} USD`)
          .addField(`One ${coin} has the price of:`, `${cryptosBTC} BTC`)
          .setFooter(`${bot.user.username}`, `${bot.user.displayAvatarURL}`);

        message.channel.send(coinEmbed);
      });
  }

  if (args[1]) {
    const currencie = args[1].toUpperCase();
    const coin = args[0].toUpperCase();

    axios
      .get(
        `https://min-api.cryptocompare.com/data/price?fsym=${coin}&tsyms=${currencie}`
      )
      .then((res) => {
        let cryptosUSD = res.data.USD;
        let cryptosEUR = res.data.EUR;
        let cryptosBTC = res.data.BTC;

        const coinEmbed = new RichEmbed()
          .setColor(colors.orange)
          .addField("Cryptocurrency: ", coin)
          .setThumbnail(`https://cryptoicons.org/api/icon/${args[0]}/100`)
          .setFooter(`${bot.user.username}`, `${bot.user.displayAvatarURL}`);

        if (currencie === "EUR") {
          coinEmbed.addField(
            `One ${coin} has the price of:`,
            `${cryptosEUR} ${currencie}`
          );
          message.channel.send(coinEmbed);
        }

        if (currencie === "USD") {
          coinEmbed.addField(
            `One ${coin} has the price of:`,
            `${cryptosUSD} ${currencie}`
          );
          message.channel.send(coinEmbed);
        }

        if (currencie === "BTC") {
          coinEmbed.addField(
            `One ${coin} has the price of:`,
            `${cryptosBTC} ${currencie}`
          );
          message.channel.send(coinEmbed);
        }
      });
  }
};

module.exports.config = {
  name: "crypto",
  description: "Display the value of a cryptocurrency",
  usage: "!crypto <btc> or !crypto <btc> <eur>",
};
