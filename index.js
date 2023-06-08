const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors')
require('dotenv').config()
var jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 5000;
const app = express();

// middleware 
app.use(cors());
app.use(express.json());
const verifyUser = (req, res, next) =>{
    const authorization = req.header.authorization;
    console.log(authorization)
    if (!authorization) {
    return  res.status(401).send({error: true, message: 'unauthorized Access' })
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.USER_ACCESS_TOKEN, (err, decoded) => {
      if (err) {
        return res.status(401).send({error: true, message: 'unauthorized access'})
      }
      req.decoded = decoded;
      next()
    })
  }


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
    const usersCollection = client.db("creativeEye").collection("users")
    const classesCollection = client.db("creativeEye").collection("classes");

    app.post('/jwt', (req, res)=>{
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: "1h"});
        res.send({token});
      })
    // save user info in database 
    app.post('/users', async(req,res)=> {
        const userInfo = req.body;
        const result = await usersCollection.insertOne(userInfo);
        res.send(result)
    })

    // get user data 
    app.get('/users',  async(req, res) => {
        const result = await usersCollection.find().toArray();
        res.send(result)
    })

    // get class data 
    app.get("/classes", async(req, res) => {
        const result = await classesCollection.find().toArray();
        res.send(result);
    })
    
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
