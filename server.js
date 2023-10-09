import mongoose from "mongoose";
import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

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
  imageURL: String,
  description: String
});

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Anime",
  },
  date: String,
  rating: String,
  text: String,
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
    const updatedAnime = await Anime.findByIdAndUpdate(animeId, { imageURL: imageURL }, { new: true });

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
    const updatedAnime = await Anime.findByIdAndUpdate(animeId, { description: description }, { new: true });

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

app.post("/addReview", async (req, res) => {
  const email = req.body.email
  try {
    const data = req.body;
    console.log(data);
    const user = await User.findOne({userEmail: email})
    console.log(user);
    const review = new Review({
      user: user,
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

app.get("/anime", async (req, res) => {
  const animes = await Anime.find({});
  res.json(animes);
});

app.get("/reviews", async (req, res) => {
  const reviews = await Review.find({}).populate('title');
  res.json(reviews);
});


app.get("/anime/:id", async (req, res) => {
  const id = req.params.id;
  const anime = await Anime.findById(id);
  console.log(anime);
  res.json({ anime });
});

app.get("/:id/reviews", async (req, res) => {
  const id = req.params.id;
  console.log("Received request for anime ID:", id);
  const reviews = await Review.find({ title: id });
  console.log("Reviews:", reviews);
  res.json(reviews);
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

app.put("/review/:id", async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        animeId: req.body.animeId,
        date: req.body.date,
        rating: req.body.rating,
        text: req.body.text,
      },
      { new: true }
    );
    res.json(review);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});
