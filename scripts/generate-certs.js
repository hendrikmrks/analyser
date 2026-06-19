const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const certsDir = path.join(__dirname, '..', 'certs');
const keyPath = path.join(certsDir, 'localhost-key.pem');
const certPath = path.join(certsDir, 'localhost-cert.pem');

if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

const attrs = [{ name: 'commonName', value: 'localhost' }];
const options = {
  keySize: 2048,
  days: 365,
  algorithm: 'sha256',
  extensions: [
    { name: 'basicConstraints', cA: false },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
      ],
    },
  ],
};

const pems = selfsigned.generate(attrs, options);
fs.writeFileSync(keyPath, pems.private);
fs.writeFileSync(certPath, pems.cert);

console.log('SSL certificates created:');
console.log(`  ${keyPath}`);
console.log(`  ${certPath}`);
console.log('');
console.log('Spotify Redirect URI (register in Dashboard):');
console.log('  http://127.0.0.1:5173/api/auth/callback');
