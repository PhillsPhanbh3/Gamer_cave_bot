const { model, Schema } = require('mongoose');

let Blacklistserver = new Schema ({
    Guild: String
})

module.exports = model('Blacklistserver', Blacklistserver);