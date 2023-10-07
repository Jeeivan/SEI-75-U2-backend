import mongoose from "mongoose";
import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
// import session from "express-session";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
// app.use(session({
//     secret: process.env.SECRET,
//     resave: false,
//     saveUninitialized: true
// }))

mongoose.connect(process.env.DATABASE_COLLECTION);

const userSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
  },
  lastLogin: {
    type: Date,
    required: true,
  },
});

const animeSchema = new mongoose.Schema({
  name: String,
});

const reviewSchema = new mongoose.Schema({
  name: String,
  date: String,
  rating: String,
  text: String,
});

const Review = mongoose.model("Review", reviewSchema);
const Anime = mongoose.model("Anime", animeSchema);
const User = mongoose.model("User", userSchema);

async function createNewAnime(name) {
  try {
    const newAnime = new Anime({
      name: name,
    });

    const savedAnime = await newAnime.save();
    console.log(`Added anime: ${savedAnime.name}`);
  } catch (error) {
    console.error(error);
  }
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`listening on port: ${port}`);
});

app.post("/user/login", async (req, res) => {
  const now = new Date();
  if ((await User.count({ userEmail: req.body.email })) === 0) {
    const newuser = new User({ userEmail: req.body.email, lastLogin: now });
    newuser.save().then(() => {
      res.sendStatus(200);
    });
  } else {
    await User.findOneAndUpdate(
      { userEmail: req.body.email },
      { lastLogin: now }
    );
    res.sendStatus(200);
  }
});

app.post("/addAnime", async (req, res) => {
  try {
    const data = req.body;
    const review = new Review({
      name: data.name,
      date: data.date,
      rating: data.rating,
      text: data.text,
    });
    await review.save();
    return res.status(200).json(review);
  } catch (err) {
    console.log("ERROR MESSAGE HERE ->", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/anime", async (req, res) => {
  const animes = await Anime.find({});
  res.json(animes);
});

app.get("/reviews", async (req, res) => {
  const reviews = await Review.find({});
  res.json(reviews);
});

app.get("/anime/:id", async (req, res) => {
  const id = req.params.id;
  const anime = await Anime.findById(id);
  console.log(anime);
  res.json({ anime });
});
