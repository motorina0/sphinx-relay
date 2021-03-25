process.on('message', (op) => {
    console.log('Sphinx Relay Server options:', op);
    initProcessEnvironment(op.env);
    // forwardConsoleParent();
    console.log = (...args) => {
        process.send({args});
      }
    require('../dist/app');
});


function initProcessEnvironment(env = {}) {
    process.env.PORT = env.port || "3300"
    process.env.NODE_IP = env.node_ip || "0.0.0.0"
    process.env.NODE_ENV = env.node_env || "production"
    process.env.LND_IP = env.lnd_ip || "localhost"
    process.env.LND_PORT = env.lnd_port || "11009"
    process.env.MACAROON_LOCATION = env.macaroon_location || "/Users/moto/Documents/GitHub/bitcoincoretech/ln-dev-tutorial/src/lnd/docker/prod/volumes/.lnd/data/chain/bitcoin/mainnet/admin.macaroon"
    process.env.TLS_LOCATION = env.tls_location || "/Users/moto/Documents/GitHub/bitcoincoretech/ln-dev-tutorial/src/lnd/docker/prod/volumes/.lnd/tls.cert"
    process.env.PUBLIC_URL = env.public_url || "localhost:3300"
    process.env.CONNECT_UI = true
}