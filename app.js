//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const lodash= require("lodash");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
mongoose.set('useCreateIndex', true);
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate");
//const https=require("https");


const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//app.use(express.static("views"))
app.use(session({
  secret:"littlethings.",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/blogDB",{useNewUrlParser: true,useUnifiedTopology: true});
const oneblogschema=new mongoose.Schema({
  title:String,
  content:String
})
const blogschema=new mongoose.Schema({
  username:String,
  googleId:String,
  title:String,
  content:[oneblogschema]
});
blogschema.plugin(passportLocalMongoose);
blogschema.plugin(findOrCreate);
const Oneblog=mongoose.model("Oneblog",oneblogschema);
const Blog=mongoose.model("Blog",blogschema);
passport.use(Blog.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Blog.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL:"http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
//   console.log(profile);
Blog.findOrCreate({ username: profile.displayName,googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
/*  Blog.findOne({},function(err,foundOne){
      if(!foundOne){
          res.render("home",{str:[]});
      }
      else{
      res.render("home",{str:foundOne.content});
      }
  });*/
res.render("home");

  // console.log(arr);
});
app.get("/auth/google",
passport.authenticate("google",{scope:["profile"]})
);
app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    let userId=req.user.googleId;
//    console.log(userId);
    res.redirect("/posts/"+userId);
  });
app.get("/compose",function(req,res){
  

    res.redirect("/login");

});
app.get("/login",function(req,res){
  res.render("login");
});
app.get("/register",function(req,res){
  res.render("register");
});
app.get("/posts/:site",function(req,res){
  if(!req.isAuthenticated()){
      res.redirect("/login");
  }
  else{
  let check=req.params.site;
//  console.log(check);
  let flag=0;
  Blog.findOne({googleId:check},function(err,foundOne){
      console.log("Match found");
      if(!foundOne){
          res.render("newposts",{userId:check,newpost:[]});
      }
      else{
      res.render("newposts",{userId:check,newpost:foundOne.content});
      }
});
  if(flag===0){
    console.log(flag);
    console.log("Not found");
  }
}
});
app.get("/posts/:site/compose",function(req,res){

  if(!req.isAuthenticated()){
    res.redirect("/login");
  }
  else{
    let check=req.params.site;
//  console.log(check);
  res.render("compose",{userId:check});
  }
});
app.post("/",function(req,res){
  let body=req.body.body;
  let title=req.body.title;
  let userId=req.body.userId;
//  console.log(userId);
  let oneblog=new Oneblog({
    title:title,
    content:body
  });
  Blog.findOne({googleId:userId},function(err,foundOne){
    if(!foundOne){
      let blog=new Blog({
        googleId:userId,
        title:title,
        content:[oneblog]
      });
      blog.save();
      res.redirect("/posts/"+userId);
    }
    else{
      foundOne.content.push(oneblog);
      foundOne.save();
      res.redirect("/posts/"+userId);
    }
  });

});

//C:\Users\HP\Desktop\EJS Challenge Starting Files\ejs-challenge\views\home.ejs










app.listen(3000, function() {
  console.log("Server started on port 3000");
});
