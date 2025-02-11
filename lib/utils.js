const core = require('@actions/core')
const database = require('./database')

exports.getSince = async (days) => {
  if (days) {
    const d = new Date()
    d.setDate(d.getDate() - days)
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  const lastUpdated = await database.getLastUpdated()
  return new Date(lastUpdated).toISOString()
}

exports.sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

exports.registerSecrets = async () => {
    core.setSecret(process.env.APP_ID)
    core.setSecret(process.env.APP_PRIVATE_KEY)
    core.setSecret(process.env.APP_INSTALLATION_ID)
}

exports.inactiveUserLabel = 'inactive-user'

exports.dryRun = process.env.DRY_RUN ? process.env.DRY_RUN.toLowerCase() == 'true' : false
