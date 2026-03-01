const { model, Schema } = require('mongoose');

const botdata = new Schema({
      guildCount: number,
      commandCount: number
})

module.exports = model('botdataJLbot', botdata);