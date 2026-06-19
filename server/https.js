const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, '..', 'certs');
const keyPath = path.join(certsDir, 'localhost-key.pem');
const certPath = path.join(certsDir, 'localhost-cert.pem');

function getHttpsOptions() {
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    return null;
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}

function certsExist() {
  return fs.existsSync(keyPath) && fs.existsSync(certPath);
}

module.exports = { getHttpsOptions, certsExist, keyPath, certPath };
