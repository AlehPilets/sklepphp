const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config();
const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(cors());

//mongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Połączono z MongoDB Atlas"))
  .catch(err => console.error("❌ Błąd połączenia z bazą:", err));


app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, password } = req.body;
    console.log(`Próba rejestracji użytkownika: ${name}`);

    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({ message: "Ta nazwa użytkownika jest już zajęta" });
    }

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, password: hashedPassword, role });
    
    await newUser.save();
    console.log(`✅ Stworzono użytkownika: ${name} z rolą: ${role}`);
    res.status(201).json({ message: "Użytkownik stworzony", role: newUser.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    console.log(`Próba logowania: ${name}`);

    const user = await User.findOne({ name });
    if (!user) return res.status(400).json({ message: "Użytkownik nie istnieje" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Błędne hasło" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    console.log(`✅ Zalogowano: ${name}`);
    res.json({ token, role: user.role, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  console.log(req.body);
  
  try {
    const { name, price, description, image, category } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Nazwa i cena są wymagane!" });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({ message: "Cena musi być liczbą dodatnią!" });
    }

    const newProduct = new Product({ name, price, description, image, category });
    await newProduct.save();
    
    console.log("✅ Produkt dodany do bazy!");
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("❌ Błąd podczas zapisu produktu:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, description, image, category } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, description, image, category },
      { new: true }
    );
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const OrderSchema = new mongoose.Schema({
  userName: String,
  total: Number,
  status: { type: String, default: 'Oczekiwanie' },
  date: { type: Date, default: Date.now }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
});