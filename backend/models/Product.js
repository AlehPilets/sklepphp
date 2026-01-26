const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  category: { type: String, default: 'Inne' } // Dodajemy kategorię
});

module.exports = mongoose.model('Product', ProductSchema);