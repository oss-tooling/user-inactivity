const database = require('../lib/database');

(async function main() {
    await database.reconcileUsers()
})()
