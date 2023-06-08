const express = require('express')
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 5000;
const app = express();

// middleware 
app.use(cors());
app.use(express.json());
// user verify by jwt
const verifyUser = (req, res, next) =>{
    const authorization = req.headers.authorization;
    if (!authorization) {
    return  res.status(401).send({error: true, message: 'unauthorized Access' })
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
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
    const enrolledClassesCollection = client.db("creativeEye").collection("enrolledClasses")

    // create jwt token
    app.post('/jwt', (req, res)=>{
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
        res.send({token});
      })
    //   verify admin
      const verifyAdmin = async (req, res, next) => {
        const email = req.decoded.email;
        const query = { email: email }
        const user = await usersCollection.findOne(query);
        if (user?.role !== 'admin') {
          return res.status(403).send({ error: true, message: 'forbidden Access' });
        }
        next();
      }
    //   verify verifyInstructor
      const verifyInstructor = async (req, res, next) => {
        const email = req.decoded.email;
        const query = { email: email }
        const user = await usersCollection.findOne(query);
        if (user?.role !== 'instructor') {
          return res.status(403).send({ error: true, message: 'forbidden Access' });
        }
        next();
      }
    // save user info in database 
    app.post('/users', async(req,res)=> {
        const userInfo = req.body;
        const result = await usersCollection.insertOne(userInfo);
        res.send(result)
    })

    // get user data 
    app.get('/users',verifyUser,verifyAdmin,  async(req, res) => {
        const result = await usersCollection.find().toArray();
        res.send(result)
    })

    // verify user roll 
    app.get('/user/role/:email',verifyUser, async(req,res) => {
        const email = req.params.email;
        const query = {email: email};
        const result = await usersCollection.findOne(query);
        res.send(result)
    })

    // make admin
    app.patch("/user/admin/:id", async(req, res) => {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const updateRole = {
            $set: {
                role: 'admin'
            },
        }
        const result = await usersCollection.updateOne(filter, updateRole);
        res.send(result)
    })
    // make Instructor
    app.patch("/user/instructor/:id", async(req, res) => {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const updateRole = {
            $set: {
                role: 'instructor'
            },
        }
        const result = await usersCollection.updateOne(filter, updateRole);
        res.send(result)
    })
    // delete user from database
    app.delete("/user/delete/:id", async(req,res) => {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const result = await usersCollection.deleteOne(filter);
        res.send(result)
    })

    // get class data 
    app.get("/classes", async(req, res) => {
        const result = await classesCollection.find().toArray();
        res.send(result);
    })
    // add class 
    app.post('/add-class',verifyUser, verifyInstructor, async(req, res)=> {
        const newClass = req.body;
        const result = await classesCollection.insertOne(newClass)
        res.send(result)
    })
    // enrolled classes
    app.post('/enroll-class', verifyUser, async (req, res) => {
        const enrollInfo = req.body;
        const classId = enrollInfo.classId
        const studentEmail = enrollInfo.email
        const filter = {classId: classId, email:studentEmail}
        const checkExisting = await enrolledClassesCollection.findOne(filter);
        if (checkExisting){
          return res.send({message: "Already Enrolled"})
        }else{
            const result = await enrolledClassesCollection.insertOne(enrollInfo);
            res.send(result)
        }
            
        
    })
    app.put("/booked-seat/:id", async(req, res) => {
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const filter = await classesCollection.findOne(query)
        console.log(filter.seats)
        const options = { upsert: true };
        if (filter.seats){
            const seats = filter.bookedSeats + 1 || 1;
            const update = { $set: { bookedSeats: seats } };
            const result = await classesCollection.updateOne(query, update, options)
            res.send(result)
        }
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
