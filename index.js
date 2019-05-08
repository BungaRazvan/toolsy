const Discord = require("discord.js");
const fs = require("fs");
const botconfig = require("./json/credentials.json");

const bot = new Discord.Client({
  disableEveryone: true
});

bot.commands = new Discord.Collection();

fs.readdir("./commands/", (err, files) => {
  if (err) console.log(err);

  let jsfile = files.filter(f => f.split(".").pop() === "js");
  if (jsfile.length <= 0) {
    console.log("Couldn't find commands.");
    return;
  }

  jsfile.forEach((f, i) => {
    let props = require(`./commands/${f}`);
    console.log(`${f} loaded!`);
    bot.commands.set(props.config.name, props);
  });
});

bot.on("guildMemberAdd", member => {
  let memberRole = member.guild.roles.find("name", "@member");
  member.addRole(memberRole);
});

bot.on("message", async message => {
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;
  if (!message.content.startsWith(botconfig.prefix)) return;

  let prefix = botconfig.prefix;
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);

  let commandfile = bot.commands.get(cmd.slice(prefix.length));
  if (commandfile) commandfile.run(bot, message, args);
});

bot.on("ready", async () => {
  console.log(`${bot.user.username} is online`);
  bot.user.setActivity(`${botconfig.prefix}help`, {
    type: "STREAMING"
  });
});

bot.login(botconfig.token);
