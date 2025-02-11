const core = require('@actions/core')
const utils = require('../lib/utils');
const { createGitHubAppClient } = require('../lib/app');

const main = async () => {
  const org = process.env.ORG
  const repo = process.env.REPO

  await utils.registerSecrets()
  const appClient = await createGitHubAppClient()
  const client = await appClient.getInstallationOctokit(process.env.GH_APP_INSTALLATION_ID)
  await client.inactiveUsers.kick(org, repo)
}

main().catch(err => {
  core.setFailed(err.message)
})
