var React = require('react');

var App = React.createClass({
  render: function() {
    return <p>Hello {this.props.user.displayName}</p>;
  }
})

module.exports = App;
