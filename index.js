const express = require('express')
const cors = require('cors')
require('dotenv').config()

const PORT = process.env.PORT || 5000;
const app = express();

// middleware 
app.use(cors());
app.use(express.json());

// server listening 
app.listen(PORT, ()=> {
    console.log(`server running on ${PORT} port`)
})
