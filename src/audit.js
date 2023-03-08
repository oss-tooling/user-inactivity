const core = require('@actions/core')
const utils = require('../lib/utils');

const main = async () => {
  await utils.registerSecrets()
  const appClient = await utils.createGitHubAppClient()
  const client = await appClient.getInstallationOctokit(process.env.GH_APP_INSTALLATION_ID)
  const since = await utils.getSince(Number(core.getInput('duration', { required: true })))
  await client.inactiveUsers.audit(process.env.ORG, since)
}

main().catch(err => {
    core.setFailed(err.message)
})
