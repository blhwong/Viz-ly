var express = require('express');
var path = require('path');
// var visionKey = require('./config/vision');
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');
// var visionKey = null;
// var configAuth = null;


var session = require('express-session');
var db = require('./db/db');
var User = db.User;
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
// var configAuth = require('../client/env/config');


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


var gcloud = require('google-cloud')( {
  projectId: process.env.VISION_PROJECT_ID,
  credentials: {
    client_email: process.env.VISION_CLIENT_EMAIL,
    private_key: process.env.VISION_PRIVATE_KEY
  },
  key: process.env.VISION_API_KEY
});


//ROUTES GO HERE
var app = express();

app.use(bodyParser.json());
app.use(session({ secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', express.static(__dirname + '/../client'));
// app.get('/', function(req, res) {
//   res.send('Gary sux');
// });

passport.use(new FacebookStrategy({
  clientID: process.env.Facebook_clientID,
  clientSecret: process.env.Facebook_clientSecret,
  callbackURL: process.env.callbackURL
},
  function(accessToken, refreshToken, profile, done) {
    User.findOne({'facebook.id': profile.id}, function(err, user) {
      if (err) {
        return done(err);
      }
      //if no user was found, create a new user with values from Facebook
      if (!user) {
        console.log(profile);
        user = new User({
          name: profile.displayName,
          email: 'tbd',
          username: profile.userName || profile.id,
          provider: 'facebook',
          facebook: profile._json
        });
        console.log(user + 'veggies!');
        user.save(function(err) {
          if (err) { return done(err); }
          return done(err, user);
        });
      } else {
        //found user. Return
        console.log(user + 'veggies!');
        return done(null, user);
      }
    });
  }
));


// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/' }));

app.get('/userLoggedIn', function(req, res) {
  console.log('---------------------------', req.user);
  // db.addFakeUser(req);
  res.send(req.user);
});


app.get('/login', function(req,res) {
  res.send('You are logged in!');
});

//All get and post requests come here before middleware

// app.get('/testget', function(req, res) {
//   console.log('testget fired!');
//   db.handler(req);
// });

app.get('/testfind', function(req, res) {
  if (req.user) {
    console.log('user here!');
  }
  if (!req.user) {
    console.log('no user here');
  }
  console.log('testfind fired');
  db.User.find()
  .then(function (data) {
    console.log(data);
    res.json(data);
  });
});


app.use(fileUpload());



app.post('/upload', function(req, res) {
  // console.log('in upload!');
  console.log('files----------', req.files);
  // console.log('dataaaaaaaa', req.files.sampleFile.data.toString());
  if (!req.files) {
    res.status(400).send('No files were uploaded...');
  }

  var sampleFile = req.files.sampleFile;
  console.log('sample files---------', sampleFile.length);
  if (sampleFile.length === undefined) {
    sampleFile = [sampleFile];
  }

  var resultCount = 0;
  var vision = gcloud.vision({
    projectId: process.env.VISION_PROJECT_ID,
    credentials: {
      client_email: process.env.VISION_CLIENT_EMAIL,
      private_key: process.env.VISION_PRIVATE_KEY
    },
    key: process.env.VISION_API_KEY
  });

  var arrayStrings = [];

  for (var file = 0; file < sampleFile.length; file++) {
    (function(file) {
      sampleFile[file].mv(__dirname + '/db/pics/pic' + file + '.jpg',function(err) {
        if (err) {
          res.status(500).send(err);
        }
        console.log('file---------', file);
        vision.detectLabels(__dirname + '/db/pics/pic' + file + '.jpg', function(err, result, apiResponse) {
          if (err) {
            // console.log('Error ', err);
            res.status(500).send(err);
          } else {
            resultCount++
            arrayStrings = arrayStrings.concat(result);
            console.log('result-------------', result);
            if (resultCount === sampleFile.length) {
              var arrayOfObj = [];
              var obj = {};
              for (var word = 0; word < arrayStrings.length; word++) {
                obj[arrayStrings[word]] ? obj[arrayStrings[word]]++ : obj[arrayStrings[word]] = 1;
              }
              for (var words in obj) {
                arrayOfObj.push({key: words, count: obj[words]});
              }

              // res.json(arrayOfObj);
              res.send(arrayOfObj);
            }
          }
        });
          // res.send('File uploaded!');
      });

    })(file);


  }



  // sampleFile.mv(__dirname + '/db/pics/hi.jpg', function(err) {
  //   if (err) {
  //     return res.status(500).send(err);
  //   }
  //   var vision = gcloud.vision({
  //     projectId: 'vizly-161619',
  //     keyFilename: __dirname + '/config/Vizly-143f14765612.json',
  //   });
  //   vision.detectLabels(__dirname + '/db/pics/hi.jpg', function(err, result, res) {
  //     if (err) {
  //       console.log('Error ', err);
  //     } else {
  //       console.log(result);
  //     }
  //   });
  //   res.send('File uploaded!');
  // });

});


module.exports = app;
