const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');


const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

dotenv.config();
const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Połączono z MongoDB"))
  .catch(err => console.error("❌ Błąd базы:", err));


app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, password } = req.body;
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: "OK", role: newUser.role });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(400).json({ message: "Użytkownik nie istnieje" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Błędne hasło" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role, name: user.name });
  } catch (error) { res.status(500).json({ error: error.message }); }
});


app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, countInStock, description, image, category } = req.body;
    const newProduct = new Product({ name, price, countInStock, description, image, category });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Usunięto" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});


app.post('/api/orders', async (req, res) => {
  try {
    const { userName, total, cartItems } = req.body;

    const newOrder = new Order({ userName, total });
    await newOrder.save();

    for (const item of cartItems) {
      await Product.findByIdAndUpdate(item._id, {
        $inc: { countInStock: -item.quantity } 
      });
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Błąd zamówienia:", error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/orders/:name', async (req, res) => {
  try {
    const orders = await Order.find({ userName: req.params.name });
    res.json(orders);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serwer na porcie ${PORT}`));