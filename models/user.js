var db = require('../lib/db');
var Promise = require('bluebird');
var vso = require('../lib/vso');

module.exports = User = function (attrs) {
  this.attrs = attrs;
  this._new = true;
}

User.find = function(id) {
  return db.collection('users').then(function(col) {
    return new Promise(function(res, rej) {
      var finder = "";

      if(typeof id === "object") {
        finder = Object.keys(id).map(function(k) {
          return 'r.' + k + '="' + id[k] + '"';
        }, '').join(" AND ");
      } else {
        finder = 'r.id="' + id + '"';
      }

      db.client.queryDocuments(col._self, 'SELECT * FROM root r WHERE ' + finder).toArray(function(err, docs) {
        if(err) return rej(err);
        if(docs.length === 0) return res(undefined);

        var user = new User(docs[0]);
        user._new = false;
        res(user);
      })
    })
  })
}

User.prototype.save = function() {
  if(this._new) return this.create();

  return this.update();
}

User.prototype.create = function() {
  var user = this;

  return db.collection('users').then(function(col) {
    return new Promise(function(res, rej) {
      db.client.createDocument(col._self, user.attrs, function(err, doc) {
        if(err) return rej(err);
        user.attrs._self = doc._self;
        user._new = false;
        res(user);
      })
    })
  })
}

User.prototype.update = function() {
  var user = this;

  return db.collection('users').then(function(col) {
    return new Promise(function(res, rej) {
      client.replaceDocument(user.attrs._self, user.attrs, function (err, replacedDoc) {
        if(err) return rej(err);
        res(user);
      });
    })
  })
}

User.prototype.getToken = function() {
  var user = this;

  return new Promise(function(res, rej) {
    if(user.isTokenValid()) {
      res(user.attrs.creds.access_token);
    } else {
      return vso.refreshToken(user.attrs.creds.refresh_token).then(function(creds) {
        user.attrs.creds = creds;

        return user.save();
      }).then(function() {
        res(user.attrs.creds.access_token);
      })
    }
  });
}

User.prototype.isTokenValid = function() {
  return Date.now() < this.attrs.creds.expiresAt - 60 * 1000 - 690*1000;
}
