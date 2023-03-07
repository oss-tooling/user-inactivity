const core = require('@actions/core')
const database = require('../lib/database');
const utils = require("../lib/utils");

const main = async () => {
  await utils.registerSecrets()
  await database.reconcileUsers()
}

main().catch(err => {
  core.setFailed(err.message)
})
