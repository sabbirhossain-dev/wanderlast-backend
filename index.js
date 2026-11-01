import express from "express";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToDatabase() {
  try {
    await client.connect();
    console.log("connected");
    return client;
  } catch (error) {
    console.dir(error);
  }
}

const databaseConnect = await connectToDatabase();

const db = databaseConnect.db("WanderlastDB");
const destinationCollection = db.collection("destinationCollection");

//verify api

const verifyApi = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];
  console.log(token);

  const JWKS = createRemoteJWKSet(
    new URL("http://localhost:3000/api/auth/jwks"),
  );
  const { payload } = await jwtVerify(token, JWKS);
  console.log(payload);
  next();
};

//home route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

//destinations post
app.post("/destinations", verifyApi, async (req, res) => {
  const destinationsData = req.body;
  const result = await destinationCollection.insertOne(destinationsData);
  console.log("inserted");
});

//destinations get
app.get("/destinations", async (req, res) => {
  const destination = await destinationCollection.find().toArray();
  res.send(destination);
});

//find by id
app.get("/destination/:id", async (req, res) => {
  const { id } = req.params;
  const singleDestination = await destinationCollection.findOne({
    _id: new ObjectId(id),
  });
  res.send(singleDestination);
});

//edit or patch
app.patch("/destination/:id", verifyApi, async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  const AfterPatch = await destinationCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData },
  );
  console.log("updated");
});
//delete
app.delete("/destination/:id", async (req, res) => {
  const { id } = req.params;
  const data = await destinationCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.send(data);
  console.log("deleted");
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
