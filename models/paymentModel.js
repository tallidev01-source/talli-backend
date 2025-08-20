const { Schema, model } = require("mongoose");
const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payer',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'gcash', 'bank transfer', 'paymaya','other'],
    default: 'cash',
  },
  paidAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// export default mongoose.model('Payment', paymentSchema);
// Export the model
module.exports = model("Payments" , paymentSchema);
