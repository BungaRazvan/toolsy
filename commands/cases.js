const { Cases } = require("../skins/sql/tables.js");

module.exports.run = async (bot, message, args) => {
  const cases = await Cases.findAll();
  let msg = "You can open all these cases: ";
  cases.forEach((cases) => {
    msg += "``` " + cases.case_name + " ```";
  });

  return message.channel.send(msg);
};

module.exports.config = {
  name: "cases",
  description: "A list of cases that you can open with .open command",
  usage: "!cases",
};
