const fs = require('fs');
const os = require('os');
const path = require('path');
const storage = require('electron-json-storage');

const homedir = os.userInfo({
    encoding: 'string'
}).homedir;


function init() {
    const osTmo = path.join(homedir, '.sphinx-relay', 'preferences');
    if (!fs.existsSync(osTmo)) {
        fs.mkdirSync(osTmo);
    }
    console.log('######################### osTmo: ', osTmo)
    storage.setDataPath(osTmo);


    storage.getAll(function (error, data) {
        if (error) console.error(error);

        console.log('storage.getAll 1.', data);
    });

    return storage;
}

module.exports = init();