const { db } = require('../config/firebase');
const fs = require('fs');
const path = require('path');

const seedData = async () => {
    try {
        const dataPath = path.join(__dirname, '../../../crbd_opti_data.json');

        if (!fs.existsSync(dataPath)) {
            console.error(`Error: crbd_opti_data.json not found at ${dataPath}`);
            process.exit(1);
        }

        const rawData = fs.readFileSync(dataPath);
        const data = JSON.parse(rawData);

        // Seed Commuters
        if (data.commuters && Array.isArray(data.commuters)) {
            const commutersRef = db.collection('commuters');
            const snapshot = await commutersRef.limit(1).get();

            if (snapshot.empty) {
                const batch = db.batch();
                data.commuters.forEach(commuter => {
                    const docRef = commutersRef.doc(); // Auto-generate ID or use unique field
                    batch.set(docRef, commuter);
                });
                await batch.commit();
                console.log(`Seeded ${data.commuters.length} commuters.`);
            } else {
                console.log('Commuters collection already has data. Skipping seed.');
            }
        }

        // Seed Deliveries
        if (data.delivery_requests && Array.isArray(data.delivery_requests)) {
            const deliveriesRef = db.collection('deliveries');
            const snapshot = await deliveriesRef.limit(1).get();

            if (snapshot.empty) {
                const batch = db.batch();
                data.delivery_requests.forEach(request => {
                    const docRef = deliveriesRef.doc();
                    batch.set(docRef, request);
                });
                await batch.commit();
                console.log(`Seeded ${data.delivery_requests.length} delivery requests.`);
            } else {
                console.log('Deliveries collection already has data. Skipping seed.');
            }
        }

        console.log("Data Import Success");
    } catch (error) {
        console.error("Data Import Failed:", error);
    }
};

seedData();
