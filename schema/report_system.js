const { model, Schema } = require('mongoose');

let Reportsystem = new Schema ({
    GuildId: String,
    ChannelId: String,
    RoleId: String,
})

module.exports = model('Reportsystem', Reportsystem);