var express = require('express');
var path = require('path');
var visionKey = require('./config/vision.js');
var bodyParser = require('body-parser');
var fileUpload = require('express-fileUpload');


var app = require('./server.js');
var db = require('./db/db.js');

var gcloud = require('google-cloud')( {
  projectId: 'vizly-161619',
  keyFilename: __dirname + '/config/Vizly-143f14765612.json',
  credentials: __dirname + '/config/Vizly-143f14765612.json',
  key: visionKey.VISION_API_KEY
});


//ROUTES GO HERE
var app = express();

app.use(bodyParser.json());

app.use('/', express.static(__dirname + '/../client'));


app.get('/testget', function(req, res) {
  console.log('testget fired, calling addFakeUser');
  db.addFakeUser(req);
  res.end();
});




//All get and post requests come here before middleware

// app.get('/testget', function(req, res) {
//   console.log('testget fired!');
//   db.handler(req);
// });

// app.get('/testfind', function(req, res) {
//   console.log('testfind fired');
//   db.User.count()
//   .then(function (data) {
//     console.log(data);
//   });
// });


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
    projectId: 'vizly-161619',
    keyFilename: __dirname + '/config/Vizly-143f14765612.json',
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
