// Load modules
const express = require('express');
const redis = require('redis');

// Constants
const REDIS_HOST = 'localhost';
const REDIS_PORT = 6379;
const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();
app.use(express.json());    

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
    const boxes = [
      { boxId: '1', content: 'name: Air Max 97, Color: White' },
      { boxId: '2', content: 'name: Air Forces 1 lv, Color: Red' },
      { boxId: '3', content: 'name: Yeezy, Color: Black' }
    ];
  
    // Save initial boxes to Redis
    await Promise.all(boxes.map(box =>
      redisClient.set(`box:${box.boxId}`, JSON.stringify(box))
    ));
  
    console.log('Initial boxes added to Redis');
  }).catch(err => {
    console.error('Error connecting to Redis:', err);
  });


// Routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// POST endpoint for adding a new box
app.post('/shoes', async (req, res) => {
    const { boxId, content } = req.body;
    if (!boxId || !content) {
        return res.status(400).send('BoxId and content are required');
    }

    try {
        // Add new box to Redis
        await redisClient.set(`box:${boxId}`, JSON.stringify({ boxId, content }));
        res.send('Box added');
    } catch (err) {
        console.error('Error adding box to Redis:', err);
        res.status(500).send('Internal Server Error');
    }
});

// GET endpoint for retrieving all boxes
app.get('/shoes', async (req, res) => {
    try {
        const keys = await redisClient.keys('box:*');
        if (!keys.length) {
            return res.status(404).send('No boxes found');
        }
        const boxes = await Promise.all(keys.map(key => redisClient.get(key)));
        res.json(boxes.map(box => JSON.parse(box)));
    } catch (err) {
        console.error('Error retrieving boxes from Redis:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/shoes', (req, res) => {
    const shoe = {
        boxid: 1,
        name: 'Nike Air Max 90',
        color: 'White',
        price: 100
    };

    redisClient.set('shoe', JSON.stringify(shoe), (err, reply) => {
        if (err) {
            console.error('Error setting shoe in Redis:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Shoe added to Redis:', reply);
            res.send('Shoe added');
        }
    });
});



app.get('/shoes', (req, res) => {
    redisClient.get('shoe', (err, shoe) => {
        if (err) {
            console.error('Error getting shoe from Redis:', err);
            res.status(500).send('Internal Server Error');
        } else if (!shoe) {
            console.log('No shoe found in Redis');
            res.status(404).send('No shoe found');
        } else {
            console.log('Shoe retrieved from Redis:', shoe);
            res.json(JSON.parse(shoe));
        }
    });
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
