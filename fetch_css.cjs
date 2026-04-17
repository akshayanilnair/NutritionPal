const https = require('https');
const fs = require('fs');

https.get('https://nutrafitaki.lovable.app/assets/index-Bjx-cUCZ.css', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('lovable.css', data);
    console.log('Done downloading CSS');
  });
}).on('error', (err) => console.log(err.message));
