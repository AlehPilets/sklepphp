const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  countInStock: { type: Number, required: true, default: 0 }, 
  description: { type: String },
  image: { type: String },
  category: { type: String }
});

module.exports = mongoose.model('Product', ProductSchema);