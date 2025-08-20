const { Schema, model } = require("mongoose");
const mongoose = require("mongoose")

const payerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // the owner who added this payer
  },
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model("Payers" , payerSchema);
