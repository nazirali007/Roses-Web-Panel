if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const url = "mongodb://127.0.0.1/RosesDB";
const app = express();
const Test = require("./models/test");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const mongoose = require("mongoose");

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
const con = mongoose.connection;

con.on("open", () => {
  console.log("connected");
});
const initializePassport = require("./passport-config");

initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);
const users = [];
app.set("view-engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { name: req.user.name });
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  checkNotAuthenticated,
  async (req, res) => {
    try {
      const hashedpassword = await bcrypt.hash(req.body.password, 10);

      const { email, password } = req.body;
      const test = await Test.findOne({
        email: email,
      });
      bcrypt.compare(
        req.body.password,
        test.password,
        function (err, valid) {
          if (valid) {
            console.log(valid);
            res.json({
              message: "logged in Successfully",
              status: "success",
            });
            return;
          } else {
            res.json({ message: "internal server error", status: "error" });
          }
        }
      );
      // console.log(test);
      if (test === null) {
        res.json({ message: "internal server error", status: "error" });
        return;
      }
      // console.log(test);
      // test.save().then(() => {
      // console.log("success");
    } catch (error) {
      console.log("error", error);

      res.json({ message: "internal server error", status: "error" });
    }
  }

  // checkNotAuthenticated,
  // passport.authenticate("local", {
  //   successRedirect: "/",
  //   failureRedirect: "/login",
  //   failureFlash: true,
);

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    // console.log(req);/
    const hashedpassword = await bcrypt.hash(req.body.password, 10);
    // users.push({
    //   id: Date.now().toString(),
    //   name: req.body.name,
    //   email: req.body.email,
    //   password: hashedpassword,
    // });
    const { name, email, password } = req.body;
    const test = Test({ name: name, email: email, password: hashedpassword });
    test.save().then(() => {
      // console.log("success");
      res.send({
        message: "Registered Successfully",
        status: "success",
      });
    });
  } catch (error) {
    console.log("error", error);
    // res.redirect("/register");
    res.send({ message: "internal server error", status: "error" });
  }
  // console.log("test->",users);
});

// app.delete("/logout", (req, res) => {
//   req.logOut();
//   res.redirect("/login");
// });

app.delete("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  // console.log("req", req.body);
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.listen(3000);
