const {
  Events,
  GatewayIntentBits,
  Client,
  Collection,
  ActivityType,
} = require("discord.js");

const path = require("path");

const env = require("dotenv");
env.config();

const { RDSClient } = require("@aws-sdk/client-rds");

const constants = require("./json/constants.json");

const { readCommands } = require("./utils/files");
const { queueIntervalPost, queueRdsStartStop } = require("./utils/interval");
const { dsGetTextChannelByName } = require("./utils/ds");
const { toggleRdsInstance } = require("./utils/aws");

const db = require("./utils/db");
const { QueueInterval } = require("./models/index");

const bot = new Client({
  disableEveryone: true,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Construct and prepare an instance of the REST module

bot.commands = new Collection();

const files = readCommands("./commands", { log: true });

for (const file of files) {
  const { name, props } = file;

  bot.commands.set(name, props);
}

bot.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) {
    return;
  }

  if (message.channel.type === "dm") {
    return;
  }

  if (!message.content.startsWith(constants.prefix)) {
    return;
  }

  const prefix = constants.prefix;
  const messageArray = message.content.split(" ");
  const cmd = messageArray[0];
  const args = messageArray.slice(1);

  const commandfile = bot.commands.get(cmd.slice(prefix.length));

  if (!commandfile) {
    return;
  }

  commandfile.run(bot, message, args);
});

bot.on("ready", async () => {
  console.log(`${bot.user.username} is online`);

  let dbConn = false;
  // const rdsClient = new RDSClient({ region: constants.awsRegion });

  bot.user.setPresence({
    activities: [
      {
        name: `a fight between two birds`,
        type: ActivityType.Watching,
      },
    ],
  });

  // TODO Make sure deployments happen during db working hours
  // await queueRdsStartStop(60 * constants.everyMinuteInMs, 12, 22, rdsClient);

  // try {
  //   await db.authenticate();
  //   console.log("Connection has been established successfully.");
  //   dbConn = true;
  // } catch (error) {
  //   console.error("Unalbe to connect to the database:", error);
  // }

  if (dbConn) {
    queues = await QueueInterval.findAll();

    const folderPath = path.resolve("./imgs/qp");

    queues.map((queue) => {
      const channel = dsGetTextChannelByName(bot, queue.qi_channel);

      if (!channel) {
        return;
      }

      queueIntervalPost(
        constants.everyMinuteInMs,
        folderPath,
        {
          at: queue.qi_at,
          name: queue.qi_name,
          userId: queue.qi_user_id,
          channelName: queue.qi_channel,
        },
        channel
      );
      console.log(
        `Queued: ${queue.qi_name} on #${queue.qi_channel} at ${queue.qi_at} every day`
      );
    });
  }
});

bot.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    interaction.reply("Unknown command");
    return;
  }

  try {
    await command.run(interaction);
  } catch (err) {
    console.error(err);
  }
});

bot.login(process.env.BOT_TOKEN);
