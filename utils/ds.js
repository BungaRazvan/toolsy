const { ChannelType } = require("discord.js");

const dsGetTextChannels = (bot) => {
  const textChannels = [];

  bot.channels.cache.each((channel) => {
    if (channel.type == ChannelType.GuildText) {
      textChannels.push(channel);
    }
  });

  return textChannels;
};

const dsGetTextChannelByName = (bot, channelName) => {
  const textChannels = dsGetTextChannels(bot);
  let textChannel = null;

  if (textChannels.length == 0) {
    return null;
  }

  textChannels.map((channel) => {
    if (channel.name == channelName) {
      textChannel = channel;
    }
  });

  return textChannel;
};

module.exports.dsGetTextChannelByName = dsGetTextChannelByName;
module.exports.dsGetTextChannels = dsGetTextChannels;
