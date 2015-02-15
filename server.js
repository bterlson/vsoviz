var fs = require('fs');
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var crypto = require('crypto');
var Promise = require('bluebird');
app.use(cookieParser());

var config = require('./config');
var request = require('request');
var vso = require('./lib/vso');
var User = require('./models/user');

var indexContent = fs.readFileSync('templates/index.html', 'utf8');

app.use(function(req, res, next) {
  if(req.cookies.sessionId) {
    User.find({sessionId: req.cookies.sessionId}).then(function(user) {
      req.user = user;
      next();
    });
  } else {
    next();
  }
});

app.use(function(req, res, next) {
  if(req.user || req.url.match(/^\/auth\/provider/) || req.url === '/favicon.ico') {
    next();
  } else {
    authorize(req, res);
  }
});

function authorize(req, res) {
  var url = 'https://app.vssps.visualstudio.com/oauth2/authorize?client_id=' +
          config.vso.clientId +
      '&response_type=Assertion' + 
      '&scope=' + config.vso.scopes +
      '&redirect_uri=' + config.vso.callbackURL

  res.redirect(url);
}

app.get('/auth/provider', function(req, res) {
  authorize(req, res);
})

app.get('/auth/provider/callback', function(req, res) {
  vso.getToken(req.query.code).then(function(creds) {
    return vso.getProfile(Promise.resolve(creds.access_token)).then(function(profile) {
      return User.find(profile.id).then(function(user) {
        if(user === undefined) {
          var user = new User({
            creds: creds,
            profile: profile,
            id: profile.id
          });

          return user.save();
        } else {
          return user;
        }
      }).then(function(user) {
        newSessionId().then(function(id) {
          user.attrs.sessionId = id;

          return user.save();
        }).then(function(user) {
          res.cookie("sessionId", user.attrs.sessionId, {maxAge: 900000, httpOnly: true});
          res.redirect('/');
        })
      })
    }, function(err) {
      if(err === "Not Authorized") {
        res.redirect('/');
      } else {
        throw err;
      }
    });
  });
});

app.get('/', function(req, res) {
  vso.getProfile(req.user.getToken()).then(function(profile) {
    res.send(indexContent.replace("{{userState}}", JSON.stringify(profile)));
  });
}); 

app.use("/", express.static(__dirname + "/public/"));

var port = process.env.PORT;

if(!port) {
    // local testing
    port = 80;
    var fs = require('fs');
    var https = require('https');
    var httpsOptions = {
        key: fs.readFileSync('./chakraviz.azurewebsites.net.key'),
        cert: fs.readFileSync('./chakraviz.azurewebsites.net.cert')
    }
    https.createServer(httpsOptions, app).listen(443);
    console.log("listening on port 443");
}

var http = require('http');
http.createServer(app).listen(port);
console.log("listening on port " + port);

function newSessionId() {
  return new Promise(function(res) {
    crypto.pseudoRandomBytes(64, function(err, data) {
      res(data.toString('hex'));
    })
  });
}
