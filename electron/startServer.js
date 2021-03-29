const path = require('path');
const {
    addRootPathToGrpc,
} = require('./interceptors');

console.log = (...args) => {
    process.send({
        args
    });
}

console.error = (...args) => {
    process.send({
        args
    });
}

console.log('Sphinx Relay Start server...');
addRootPathToGrpc();

function init() {
    try {
        const config = require(path.join(process.env.APP_PATH, 'dist/config/config.json'));
        if (config && config.production) {
            config.production.storage = process.env.DB_LOCATION
        }
        require('../dist/app');
    } catch (err) {
        console.error('Failed to load server app!', err);
    }
}

init();