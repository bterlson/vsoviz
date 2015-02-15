var docdb = require('documentdb');
var Promise = require('bluebird');
var config = require('../config');
var DB_NAME = 'chakraviz';

exports.client = client = new docdb.DocumentClient(config.docdb.host, { masterKey: config.docdb.masterKey });

exports.collection = function(id) {
  return new Promise(function(res, rej) {
    client.queryDatabases('SELECT * FROM root r WHERE r.id="' + DB_NAME + '"').toArray(function(err, results) {
      if(err) return rej(err);
      if(results.length === 0) return rej("Couldn't find database");

      res(results[0]);
    })
  }).then(function(db) {
    return new Promise(function(res, rej) {
      client.queryCollections(db._self, 'SELECT * FROM root r WHERE r.id="' + id + '"').toArray(function(err, results) {
        if(err) return rej(err);
        if(results.length === 0) return rej("Couldn't find database");

        res(results[0]);
      })
    })
  });
}
