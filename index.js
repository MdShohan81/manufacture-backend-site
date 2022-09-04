const express = require('express')
const cors = require('cors');
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

        //Post Order
         app.post('/order', async (req, res) => {
          const order = req.body;
          const result = await orderCollection.insertOne(order);
          res.send(result)
      });

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