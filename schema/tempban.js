const { Schema, model } = require('mongoose');

const TempbanSchema = new Schema({
    Guild: String,
    User: String,
    BanTime: String
});

module.exports = model('BetaTempban', TempbanSchema);