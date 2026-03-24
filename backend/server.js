const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const deliveryRoutes = require('./src/routes/deliveryRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: "API Active", timestamp: new Date() });
});

// Routes
app.use('/', deliveryRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
