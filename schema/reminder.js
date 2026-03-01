const { model, Schema } = require('mongoose');

let Reminder = new Schema({
    User: String,
    RemTime: Number,
    Reminder: String,
})

module.exports = model('Reminder', Reminder);