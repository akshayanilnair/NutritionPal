const https = require('https');
const fs = require('fs');

https.get('https://nutrafitaki.lovable.app/', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    // try to find CSS links
    const matches = data.match(/<link rel="stylesheet" href="([^"]+)"/g);
    fs.writeFileSync('lovable.html', data);
    console.log(matches);
  });
}).on('error', (err) => console.log(err.message));
