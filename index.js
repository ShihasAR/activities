const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const lodash = require('lodash');

input_array = [];


const aboutContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
const composeContent = "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.Est ullamcorper eget nulla facilisi etiam dignissim. Neque volutpat ac tincidunt vitae semper. Commodo odio aenean sed adipiscing diam donec adipiscing tristique risus. Ut ornare lectus sit amet est placerat in.";
const contactContent = "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.get("/", function(req, res) {
  res.render("about", {
    "content": aboutContent
  });
});



app.get("/posts/:topic", function(req, res) {
  let the_topic = lodash.lowerCase(req.params.topic);
  for (var i = 0; i < input_array.length; i++) {
    if (the_topic === lodash.lowerCase(input_array[i]["title"])) {
      res.render("post",{
        "comp_array": input_array[i]
      });
    };

};
});

app.get("/contact", function(req, res) {
  res.render("contact", {
    "content": contactContent
  });
});

app.get("/about", function(req, res) {
  res.render("home", {
    "content": aboutContent,
    "posts": input_array
  });
});

app.get("/compose", function(req, res) {
  res.render("compose");
});

app.post("/compose", function(req, res) {
  const info = {
    "title": req.body.title,
    "textbody": req.body.textbody
  };
  input_array.push(info);
  res.redirect("/");
});

app.listen(3000, function() {
  console.log("Server running on port 3000");
});
