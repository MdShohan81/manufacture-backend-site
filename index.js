const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const res = require('express/lib/response');

const app = express();
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
      return res.status(401).send({message: 'unauthorized access'});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
      if(err){
          return res.status(403).send({message: 'Forbidden access'});
      }
      console.log('decoded', decoded);
      req.decoded = decoded;
      next();
  })
  
  
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o486h34.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){

    try{
        await client.connect();
        
        const productCollection = client.db('manufacture').collection('products');
        const orderCollection = client.db('manufacture').collection('order');
        const userCollection = client.db('manufacture').collection('users');
        const reviewCollection = client.db('manufacture').collection('reviews');
        const paymentCollection = client.db('manufacture').collection('payments');
        const profileCollection = client.db('manufacture').collection('profile');

      //all product get api
        app.get('/product', async(req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products)

        });

        //single product get api
        app.get('/product/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const products = await productCollection.findOne(query);
            res.send(products);

        });

        //product add api 
        app.post('/product', async(req, res) => {
          const newProduct = req.body;
          const products = await productCollection.insertOne(newProduct);
          res.send(products);
      });

        // product delete api
        app.delete('/product/:id', async(req, res) => {
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const products = await productCollection.deleteOne(query);
          res.send(products);

      });

      app.post('/create-payment-intent', verifyJWT, async(req, res) => {
        const order = req.body;
        const totalPrice = order.totalPrice;
        const amount = totalPrice*100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          payment_method_types: ['card']
        });
        res.send({clientSecret: paymentIntent.client_secret})

      })



        //Get User api
        app.get('/user', verifyJWT, async(req, res) => {
          const users = await userCollection.find().toArray();
          res.send(users);
        });

     

      // admin get api
      app.get('/admin/:email', async(req,res) => {
        const email = req.params.email;
        const user = await userCollection.findOne({email: email});
        const isAdmin = user.role === 'admin';
        res.send({admin: isAdmin})
      })

      //User put api
      app.put('/user/admin/:email', verifyJWT, async(req,res) =>{
        const email = req.params.email;
        const requester = req.decoded.email;
        const requesterAcc = await userCollection.findOne({ email: requester });
        if(requesterAcc.role === 'admin'){
          const filter = {email: email};
          const updateDoc = {
              $set: {role: 'admin'},
          };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
        }
        else{
          res.status(403).send({message: 'forbidden'});
        }
        

      })

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
          const token =jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'});
          res.send({result, token});

        })

       
        // Get user Order APi
        app.get('/order', verifyJWT, async(req,res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if(email === decodedEmail){
              const query = {email: email};
              const cursor = orderCollection.find(query);
              const orders = await cursor.toArray();
              return res.send(orders);
            }
            else{
              return res.status(403).send({message: 'forbidden access'});
            }
            
        })
        
       
        //Post Order
         app.post('/order', async (req, res) => {
          const order = req.body;
          const result = await orderCollection.insertOne(order);
          res.send(result)
      });

      //order patch
      app.patch('/order/:id', verifyJWT, async(req, res) => {
        const id = req.params.id;
        const payment = req.body;
        const filter = {_id: ObjectId(id)};
        const updatedDoc = {
          $set: {
            paid: true,
            transactionId: payment.transactionId
          }
        }
        const result = await paymentCollection.insertOne(payment)
        const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);
        res.send(updatedDoc);


      })
     
      app.get('/order/:id', verifyJWT, async(req, res) => {
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const result = await orderCollection.findOne(query);
        res.send(result);
      })

      app.get("/allOrders", verifyJWT, async (req, res) => {
        const query = {};
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      });
   

      //delete api
      app.delete('/order/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const result = await orderCollection.deleteOne(query);
        res.send(result);

    });

    

    //review get api
    app.get('/review', async(req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    })

    //Review post api
    app.post('/review', async(req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
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