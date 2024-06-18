// Load modules
const express = require('express');
const redis = require('redis');
const cors = require('cors');

const options = {
    origin:'http://localhost:3001'
}
// Constants
const REDIS_HOST = 'localhost';
const REDIS_PORT = 6379;
const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();
app.use(express.json());    
app.use(cors(options));

// Create Redis client
const redisClient = redis.createClient({
    socket: {
    host: REDIS_HOST,
    port: REDIS_PORT
    }
});


// Connect to Redis
redisClient.connect().then(async () => {
    console.log('Connected to Redis');
  
    // Populate initial values in Redis
    const Shoes = [
        {
            id: "1",
            Name: "Air Max 97",
            Color: "White",
            Price: "$180"
        },
        {
            id: '2',
            Name: "Air Forces 1 lv",
            Color: "Red",
            Price: "$110"
        },
        {
            id: '3',
            Name: "Yeezy",
            Color: "Black",
            Price: "$220"
        },
        {
            id: "4",
            Name: "Air Max 97",
            Color: "Pink",
            Price: "$180"
        },
        {
            id: '5',
            Name: "Air Forces 1 lv",
            Color: "Yellow",
            Price: "$110"
        },
        {
            id: '6',
            Name: "Air Jordan 1",
            Color: "Blue",
            Price: "$220"
        },
        {
            id: "7",
            Name: "Retro Jordan 4",
            Color: "White",
            Price: "$250"
        },
        {
            id: '8',
            Name: "Air Jordan Low",
            Color: "Black",
            Price: "$210"
        },
        {
            id: '9',
            Name: "Dunks",
            Color: "Green",
            Price: "$160"
        },
        {
            id: "10",
            Name: "Air Jordan 1",
            Color: "Purple",
            Price: "$180"
        },
        {
            id: '11',
            Name: "KD 14 NRG",
            Color: "Blue",
            Price: "$160"
        },
        {
            id: '12',
            Name: "Samba",
            Color: "White",
            Price: "$100"
        }
    ];
  
    // Save initial boxes to Redis
    await Promise.all(Shoes.map(Shoe =>
      redisClient.set(`Shoe:${Shoe.id}`, JSON.stringify(Shoe))
    ));
  
    console.log('Initial Shoes added to Redis');
  }).catch(err => {
    console.error('Error connecting to Redis:', err);
  });


// Routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// POST endpoint for adding a new shoe
app.post('/shoes', async (req, res) => {
    const { id, Name, Color, Price} = req.body;
    if (!id || !Name || !Color || !Price) {
        return res.status(400).send('id, Name, Color, and Price are required');
    }

    try {
        // Add new shoe to Redis
        await redisClient.set(`Shoe:${id}`, JSON.stringify({ id, Name, Color, Price }));
        res.send('Shoe added');
    } catch (err) {
        console.error('Error adding shoe to Redis:', err);
        res.status(500).send('Internal Server Error');
    }
});

// GET endpoint for retrieving all shoes
app.get('/shoes', async (req, res) => {
    try {
        const keys = await redisClient.keys('Shoe:*');
        if (!keys.length) {
            return res.status(404).send('No shoes found');
        }
        const shoes = await Promise.all(keys.map(key => redisClient.get(key)));
        res.json(shoes.map(shoe => JSON.parse(shoe)));
    } catch (err) {
        console.error('Error retrieving shoes from Redis:', err);
        res.status(500).send('Internal Server Error');
    }
});

// GET endpoint for searching shoes by name
app.get('/search', async (req, res) => {
    const searchItem = req.query.q; // Use query parameter
    if (!searchItem) {
        return res.status(400).send('Search parameter is required');
    }

    try {
        const keys = await redisClient.keys('Shoe:*');
        if (!keys.length) {
            return res.status(404).send('No shoes found');
        }
        const shoes = await Promise.all(keys.map(key => redisClient.get(key)));
        const filteredShoes = shoes.map(shoe => JSON.parse(shoe)).filter(shoe => shoe.Name.toLowerCase().includes(searchItem.toLowerCase()));
        res.json(filteredShoes);
    } catch (err) {
        console.error('Error searching shoes in Redis:', err);
        res.status(500).send('Internal Server Error');
    }
}); 

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
