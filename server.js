import mongoose from "mongoose";
import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import serverless from "serverless-http";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

export const handler = serverless(app);

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
  name: String,
  img: String,
});

const animeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  imageURL: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const reviewSchema = new mongoose.Schema({
  user: String,
  title: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Anime",
  },
  date: String,
  rating: String,
  text: {
    type: String,
    required: true,
  },
  image: String,
  name: String,
});

const Review = mongoose.model("Review", reviewSchema);
const Anime = mongoose.model("Anime", animeSchema);
const User = mongoose.model("User", userSchema);

async function createNewAnime(name, imageURL) {
  try {
    const newAnime = new Anime({
      name: name,
      imageURL: imageURL, // Set the imageURL when creating a new anime
    });

    const savedAnime = await newAnime.save();
    console.log(`Added anime: ${savedAnime.name}`);
  } catch (error) {
    console.error(error);
  }
}

async function addImgToAnime(animeId, imageURL) {
  try {
    const updatedAnime = await Anime.findByIdAndUpdate(
      animeId,
      { imageURL: imageURL },
      { new: true }
    );

    if (!updatedAnime) {
      console.log("Anime not found");
      return;
    }

    console.log(`Added imageURL to anime: ${updatedAnime.name}`);
  } catch (error) {
    console.error(error);
  }
}

async function addDescriptionToAnime(animeId, description) {
  try {
    const updatedAnime = await Anime.findByIdAndUpdate(
      animeId,
      { description: description },
      { new: true }
    );

    if (!updatedAnime) {
      console.log("Anime not found");
      return;
    }

    console.log(`Added description to anime: ${updatedAnime.name}`);
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
    const newuser = new User({
      userEmail: req.body.email,
      name: req.body.name,
      img: req.body.img,
      lastLogin: now,
    });
    newuser.save().then(() => {
      res.sendStatus(200);
    });
  } else {
    await User.findOneAndUpdate(
      { userEmail: req.body.email },
      { name: req.body.name },
      { img: req.body.img },
      { lastLogin: now }
    );
    res.sendStatus(200);
  }
});

app.get("/profiles", async (req, res) => {
  const profiles = await User.find({});
  res.json(profiles);
});

app.post("/addReview", async (req, res) => {
  const email = req.body.email;
  try {
    const data = req.body;
    // console.log(data);
    const user = await User.findOne({ userEmail: email });
    // console.log(user);
    const review = new Review({
      image: data.image,
      user: user.userEmail,
      name: data.name,
      title: data.animeId,
      date: data.date,
      rating: data.rating,
      text: data.text,
    });
    await review.save();
    res.sendStatus(200);
  } catch (err) {
    console.log("ERROR MESSAGE HERE ->", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/addAnime", async (req, res) => {
  try {
    const data = req.body;
    // console.log(data);
    const anime = new Anime({
      name: data.name,
      imageURL: data.imageURL,
      description: data.description,
    });
    await anime.save();
    res.sendStatus(200);
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
  const reviews = await Review.find({}).populate("title").populate("user");
  res.json(reviews);
});

app.get("/anime/:id", async (req, res) => {
  const id = req.params.id;
  const anime = await Anime.findById(id);
  // console.log(anime);
  res.json({ anime });
});

app.get("/:id/reviews", async (req, res) => {
  const id = req.params.id;
  console.log("Received request for anime ID:", id);
  const reviews = await Review.find({ title: id });
  console.log("Reviews:", reviews);
  res.json(reviews);
});

app.get("/review/single/:id", async (req, res) => {
  const id = req.params.id;
  console.log("Received request for review ID:", id);

  try {
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    console.log("Review:", review);
    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/review/single/:id", async (req, res) => {
  Review.updateOne({ _id: req.params.id }, { $set: { text: req.body.text } })
    .then(() => {
      res.sendStatus(200);
    })
    .catch((error) => {
      // console.error(error);
      res.sendStatus(400);
    });
});

app.delete("/review/:id", async (req, res) => {
  try {
    await Review.deleteOne({ _id: req.params.id });
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});
