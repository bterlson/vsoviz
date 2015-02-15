var React = require('react');
var App = require('./components/app');
var userState = JSON.parse(document.getElementById('userState').innerText)

React.render(
  <App user={userState} />,
  document.getElementById('container')
);
