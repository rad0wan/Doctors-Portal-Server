const express = require('express')
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@doctors-portal.zdzd0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {

        await client.connect();
        const serviceCollection = client.db("doctors-portal").collection("services");
        const bookingCollection = client.db("doctors-portal").collection("bookings");
        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date;

            // step 1 : get all the services
            const services = await serviceCollection.find().toArray();

            // step:2 get the booking of the day
            const query = { date: date }
            const bookings = await bookingCollection.find(query).toArray();

            services.forEach(service => {
                const serviceBooking = bookings.filter(book => book.treatMent === service.name)
                const booked = serviceBooking.map(book => book.slot)
                const available = service.slots.filter(s => !booked.includes(s))
                service.slots = available;
            })

            res.send(services)
        })
        /**
         * API naming convention
         * app.get('/booking') // get all booking in the collections or get more than one by query filter
         * app.get('/booking'/:id) // get a specific booking
         * app.post('/booking') // add a new booking 
         * app.patch('/booking') // update one or more booking
         * app.delete('/booking') // delete a booking 
        */

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const query = { patientEmail: booking.patientEmail, date: booking.date, treatMent: booking.treatMent }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = bookingCollection.insertOne(booking)
            res.send({ success: true, result })
        })

    }
    finally { }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})