const { model, Schema } = require('mongoose');

let UserBlacklist = new Schema ({
    User: String
})

module.exports = model('UserBlacklist', UserBlacklist);