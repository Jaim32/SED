const fs = require('fs');

let data = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));

function saveData() {
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
}

module.exports = { data, saveData };
