var fs = require('fs');

var version = JSON.parse( fs.readFileSync( __dirname+'/../package.json' ) ).version

module.exports = exports = version;