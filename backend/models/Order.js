const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  total: { type: Number, required: true },
  status: { type: String, default: 'Oczekiwanie' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);