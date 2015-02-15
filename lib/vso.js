var Promise = require('bluebird');
var config = require('../config.js');
var request = require('request');

var TOKEN_URL = 'https://app.vssps.visualstudio.com/oauth2/token';

exports.getToken = function(code) {

  return new Promise(function(res, rej) {
    var start = Date.now();
    request.post(TOKEN_URL, { form: {
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: config.vso.clientSecret,
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: code,
        redirect_uri: config.vso.callbackURL
    }}, function(err, resp, data) {
      if(err) return rej(err)
      if(resp.statusCode !== 200) return rej(JSON.parse(data));

      var creds = JSON.parse(data);
      creds.expiresAt = start + Number(creds.expires_in) * 1000

      res(creds);
    });

  })
}

exports.refreshToken = function(code) {

  return new Promise(function(res, rej) {
    var start = Date.now();
    request.post(TOKEN_URL, { form: {
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: config.vso.clientSecret,
        grant_type: 'refresh_token',
        assertion: code,
        redirect_uri: config.vso.callbackURL
    }}, function(err, resp, data) {
      if(err) return rej(err)

      var creds = JSON.parse(data);
      creds.expiresAt = start + Number(creds.expires_in) * 1000

      res(creds);
    });
  })
}

exports.getProfile = function(tok) {
  return tok.then(function(tok) {
    return new Promise(function(res, rej) {
      request.get({
        url:'https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=1.0',
        headers: {
          Authorization: "Bearer " + tok,
          Accept: 'application/json'
        },
        followRedirect: false
      }, function(err, resp, data) {
        if(err) return rej(err);
        if(resp.statusCode !== 200) return rej("Not Authorized");

        res(JSON.parse(data));
      });
    })
  })
}
