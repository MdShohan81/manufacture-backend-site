const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o486h34.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){

    try{
        await client.connect();
        
        const productCollection = client.db('manufacture').collection('products');
        const orderCollection = client.db('manufacture').collection('order');
        const userCollection = client.db('manufacture').collection('users');


        app.get('/product', async(req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products)

        });
        app.get('/product/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const products = await productCollection.findOne(query);
            res.send(products);

        });


        //User put api
        app.put('/user/:email', async(req,res) =>{
          const email = req.params.email;
          const user = req.body;
          const filter = {email: email};
          const options = { upsert: true};
            const updateDoc = {
                $set: user,
            };
          const result = await userCollection.updateOne(filter, updateDoc, options);
          const token =jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
          res.send({result, token});

        })

        // Get Order APi
        app.get('/order', async(req,res) => {
            const email = req.query.email;
            const query = {email: email};
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })
        

        //Post Order
         app.post('/order', async (req, res) => {
          const order = req.body;
          const result = await orderCollection.insertOne(order);
          res.send(result)
      });

      //delete api
      app.delete('/order/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const result = await orderCollection.deleteOne(query);
        res.send(result);

    })


    }
    finally{

    }


}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello I am from manufacture')
})

app.listen(port, () => {
  console.log(`manufacture app listening on port ${port}`)
})