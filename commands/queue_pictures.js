const { QueueInterval, QueuePicture } = require("../models/index");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { ChannelType } = require("discord.js");
const { queueIntervalPost } = require("./../utils/interval");
const path = require("path");

const config = {
  name: "qp",
  description: "Queue a time and pictures to be sent to a channel",
  usage: "/qp",
  slashCommand: true,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName(config.name)
    .setDescription(config.description)
    .addStringOption((option) =>
      option.setName("name").setDescription("Queue Name").setRequired(true)
    )

    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("channel to send the picture")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption((option) =>
      option
        .setName("at")
        .setDescription("the time at which the picture is sent. 5PM or 5AM")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("urls")
        .setDescription("image urls to send each day. Comma separeted list")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("description").setDescription("Describe the queue")
    ),

  async run(interaction) {
    const channel = interaction.options.getChannel("channel");
    const name = interaction.options.getString("name").toLowerCase();
    const at = interaction.options.getString("at");
    const description = interaction.options.getString("description") || null;

    const userId = interaction.user.id;
    const channelName = channel.name;

    const folderPath = path.resolve("./imgs/qp");

    const urls = interaction.options.getString("urls").split(",");
    const savedIntervals = await QueueInterval.findAll({
      where: {
        qi_user_id: interaction.user.id,
        qi_name: name,
        qi_channel: channelName,
      },
    });

    let newInterval = null;

    if (savedIntervals.length == 0) {
      newInterval = await QueueInterval.create({
        qi_channel: channelName,
        qi_user_id: userId,
        qi_name: name,
        qi_at: at,
        qi_description: description,
      });
      const queueUrls = [];

      urls.map((url) => {
        queueUrls.push({
          qp_image: url,
          qp_interval_id: newInterval.qi_id,
        });
      });

      await QueuePicture.bulkCreate(queueUrls);

      const queuPost = await queueIntervalPost(
        60 * 1000,
        folderPath,
        {
          at,
          channelName,
          name,
          userId,
        },
        channel
      );
    } else if (savedIntervals.length == 1) {
      const queueUrls = [];

      urls.map((url) => {
        queueUrls.push({
          qp_image: url,
          qp_interval_id: savedIntervals[0].qi_id,
        });
      });

      await QueuePicture.bulkCreate(queueUrls);

      return await interaction.reply(
        `Succesfully added more images to queue: **${savedIntervals[0].qi_name}**`
      );
    }

    return await interaction.reply(
      `Succesfully queued images every day at: ${at} on <#${channel.id}> channel`
    );
  },
};

module.exports.config = {
  ...config,
};
