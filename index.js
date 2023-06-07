const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors')
require('dotenv').config()

const PORT = process.env.PORT || 5000;
const app = express();

// middleware 
app.use(cors());
app.use(express.json());

// Connect the client to the server
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@4meprogramming.mp2bykf.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


// server listening 
app.listen(PORT, ()=> {
    console.log(`server running on ${PORT} port`)
})
