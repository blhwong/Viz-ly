var app = require('./app.js');
var db = require('./db/db.js');
var fileUpload = require('express-fileUpload');
var Vision = require('@google-cloud/vision');
var google = require('googleapis');
var GoogleAuth = require('google-auth-library');


var app = express();

app.use(bodyParser.json());
app.use(fileUpload());

app.use('/', express.static(__dirname + '/../client'));


app.post('/upload', function(req, res) {
  console.log('in upload!');
  if (!req.files) {
    return res.status(400).send('No files were uploaded...');
  }

  var sampleFile = req.files.sampleFile;
  sampleFile.mv(__dirname + '/db/hi.jpg', function(err) {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('File uploaded!');
  });

});



// app.get('/testget', function(req, res) {
//   console.log('testget fired, calling addFakeUser');
//   db.addFakeUser(req);
//   res.end();
// });

//For get/set routes go to routes.js



app.listen(3000, function() {
  console.log('Server listening.  Go Vizly');
});

