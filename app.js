//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const app = express();
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate')
// const md5 = require('md5');
// const encrypt = require('mongoose-encryption');
// var ObjectId = require('mongodb').ObjectID;
var _ = require('lodash');
var flash        = require('req-flash');


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://vmadmin:vmadmin@cluster0.npeak.mongodb.net/vmadmin?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'satvik is a good boy   ',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true
  }
}))

// using passport

app.use(passport.initialize());
app.use(passport.session());
// scema
app.use(flash());

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId : String,
  name : String,
  img : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// added env variable for better security
// userSchema.plugin(encrypt ,{secret : process.env.SECRET, encryptedFields : ["password"]});
    var imgurl = 'images/user.png';
const User = new mongoose.model("user", userSchema);
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id , name : profile.displayName , img : profile.photos[0].value  }, function (err, user) {
      imgurl = user.img;
      return cb(err, user);
    });
  }
));

const memberSchema = new mongoose.Schema({
  name : String,
  passing_year : Number,
  branch : String ,
  line: String,
  img:
    {
        data: Buffer,
        contentType: String
    },
    fblink : String,
    iglink : String,
    linkedinlink : String,

});
const Member =  mongoose.model("member",memberSchema);

app.get("/",(req,res)=>{
  res.render("index",{auth : false, img : 'images/user.png'});

})

app.get("/events",(req,res)=>{
  res.render("events",);

})
app.get("/members",(req,res)=>{
  Member.find({},function(err,members){
    res.render('members',{members});
});


})
app.get("/gallery",(req,res)=>{
  res.render("gallery");

})
app.get("/funzone",(req,res)=>{
  res.render("fun");

})

app.get("/vivekanand",(req,res)=>{
  res.render("vivekanand");

})
app.get("/videogallery",(req,res)=>{
  res.render("video_gallery");

})
app.get('/library', function(req, res) {
    res.sendFile('views/library.html', {root: __dirname })
});
app.get("/blog",(req,res)=>{
  res.render("blog");

})
app.get("/signup",(req,res)=>{
  res.render("signup");

})
app.get("/login",(req,res)=>{
  res.render("login");

})
app.get("/profile",(req,res)=>{
  res.render("profile");

})
app.get("/secrets", function(req, res){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      alert('err');
      console.log(err);
    } else {
      if (foundUsers) {
        // console.log(foundUsers);

        if(foundUsers.googleId){
          imgurl = foundUsers.img;
        }
        res.render("index", { auth : true , img : imgurl});
      }
    }
  });
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

  app.get('/logout',function(req,res){
    imgurl = 'images/user.png';
    req.logout();
    res.redirect('/')
  })


  app.post("/signup", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
      if (err) {
        console.log(err);
        req.flash('errorMessage', err);
        res.redirect("/signup");
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
        });
      }
    });

  });
app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
      req.flash('errorMessage', err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});







const PORT=process.env.PORT || 3000;


app.listen(PORT, function() {
  console.log("Server started on port 3000");
});
