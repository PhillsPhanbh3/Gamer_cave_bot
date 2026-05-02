const { Schema, model } = require("mongoose");

const GCBClicker = new Schema(
  {
    guildId: { type: String, required: true, unique: true },
    totalClicks: { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

module.exports = model("GCBClicker", GCBClicker);
