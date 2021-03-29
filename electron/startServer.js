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

function init(){
    try {
        require('../dist/app');
    } catch (err) {
        console.error('Failed to load server app!', err);
    }
}

init();