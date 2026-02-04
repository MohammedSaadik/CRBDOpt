const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET / - Fetch all delivery requests
router.get('/', async (req, res) => {
    try {
        const deliveriesRef = db.collection('deliveries');
        const snapshot = await deliveriesRef.get();

        if (snapshot.empty) {
            return res.json([]);
        }

        const deliveries = [];
        snapshot.forEach(doc => {
            deliveries.push({ id: doc.id, ...doc.data() });
        });

        res.json(deliveries);
    } catch (error) {
        console.error("Error fetching deliveries:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
