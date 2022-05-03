require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const lodash = require('lodash');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: "this is the secret.",
  saveUninitialized: false,
  resave: false
}));

let all_posts = [];
let title_to_edit = [];
let site = [];


app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/blogDb");


const postSchema = mongoose.Schema({
  username: String,
  password: String,
  title: String,
  textbody: String,
  category: String,
  stream: String,
  date: String,
  venue: String,
  googleId: String
});



postSchema.plugin(passportLocalMongoose);
postSchema.plugin(findOrCreate);

const User = mongoose.model("User", postSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/activities",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


const aboutContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
const composeContent = "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.Est ullamcorper eget nulla facilisi etiam dignissim. Neque volutpat ac tincidunt vitae semper. Commodo odio aenean sed adipiscing diam donec adipiscing tristique risus. Ut ornare lectus sit amet est placerat in.";
const contactContent = "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";



app.get("/", function(req, res) {
  res.render("home", {
    "content": aboutContent
  });
});

app.get("/auth/google", passport.authenticate('google', {

  scope: ['profile']

}));

app.get('/auth/google/activities',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect compose.
    res.redirect(site[0]);
  });

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/events", function(req, res) {
  User.find({}, function(err, result) {
    res.render("events", {
      "content": aboutContent,
      "posts": result
    });
  });
});




app.get("/posts/:topic", function(req, res) {
  let the_topic = lodash.lowerCase(req.params.topic);
  User.find({
    _id: req.params.topic
  }, function(err, result) {
    if (!err) {
      res.render("post", {
        "comp_array": result[0]
      });

    }
  });
});


app.get("/contact", function(req, res) {
  res.render("contact", {
    "content": contactContent
  });
});

app.get("/activities", function(req, res) {
  User.find({}, function(err, result) {
    res.render("activities", {
      "content": aboutContent,
      "posts": result
    });
  });

});

app.get("/compose", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    site[0] = "/compose" ;
    res.redirect("/login");
  }
});



app.post("/compose", function(req, res) {

  const title_found = req.body.title;
  const tb = req.body.textbody;
  const flex = req.body.flexRadioDefault;
  const st = req.body.stream;



  User.findById(req.user._id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        const nuser = new User({
          title: title_found,
          textbody: tb,
          category: flex,
          stream: st,
          date: req.body.date,
          venue: req.body.venue,
          googleId: foundUser.googleId
        });
        all_posts.push(nuser);
        nuser.save(function() {
          res.redirect("/");
        });

      }
    }
  });

});

app.post("/register", function(req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      });
    }
  });

});





app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(error) {
    if (!error) {
      User.find({}, function(err, result) {
        if (result.username === user.username) {

          passport.authenticate("local")(req, res, function() {
            res.redirect(site[0]);
            site = [];
          });
        } else {
          res.render("loginerror");

        }
      });
    } else {
      console.log(error);
    }
  });

});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/edits", function(req, res) {
  let find = title_to_edit[title_to_edit.length - 1];
  let updated_entry = req.body.edited;

  User.findOneAndUpdate({
    _id: find
  }, {
    $set: {
      title: req.body.t,
      textbody: updated_entry,
      category: req.body.flexRadioDefault,
      stream: req.body.stream,
      date: req.body.date,
      venue: req.body.venue


    }
  },{new: true}, function(err, res) {
    if (!err) {
      console.log("Updated");


    }
  });

  title_to_edit = [];
  res.redirect("/");
});


app.get("/edit", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("edit");
  } else {
    site[0] = "/edit" ;
    res.redirect("/login");
  }
});

app.get("/delete", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("delete");
  } else {
    site[0] = "/delete" ;
    res.redirect("/login");
  }
});

app.post("/edit", function(req, res) {
  User.findById(req.user._id, function(err, foundUser) {
    if (!err) {
      User.find({
        title: req.body.title
      }, function(error, result) {
        if (!error) {

          if (result.length === 0) {

              res.render("error");

          }
          else {
          if (foundUser.googleId === result[0].googleId) {

            title_to_edit.push(result[0]._id);
            res.render("edits", {
              "comp_array": result[0]
            });

          }}}
          else {

              res.render("error");

          }
        });
      } else
      {
        console.log("main error" + err);
      }
});
});

app.post("/delete", function(req, res) {
  
  User.findById(req.user._id, function(err, foundUser) {
    if (!err) {
      if(foundUser){
      User.find({title: req.body.title}, function(error,result){
        if (!error){
          if (result.length === 0) {

              res.render("derror");

          }
          else {
            if(foundUser.googleId === result[0].googleId){
          User.findOneAndDelete({title: req.body.title},function(er,resp){
            if(!er){
            res.redirect("/");
          } else{
            console.log(er);
          }});
        }
          }
        }});
      }}
      else
      {
        console.log("main error" + err);
      }

    });

});




app.listen(3000, function() {
  console.log("Server running on port 3000");
});
