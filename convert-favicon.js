const fs = require('fs');
const path = require('path');

// Since we don't have image processing libs, let's just copy the logo
// and let the browser handle the display as white through CSS
fs.copyFileSync('logo.png', 'favicon.ico');
console.log('Favicon created');
