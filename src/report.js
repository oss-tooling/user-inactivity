const core = require('@actions/core')
const utils = require('../lib/utils')
const database = require('../lib/database')
const { createGitHubAppClient} = require('../lib/app')

const notificationBody = process.env.AUDIT_NOTIFICATION_BODY || `This organization automatically removes inactive users from its GitHub organization.  Your account has been inactive for ${database.INACTIVE_DURATION} days and is pending removal.

 You can maintain access by responding to this issue or by making a commit, creating an issue or PR, or by commenting on something every ${database.INACTIVE_DURATION} days. 
`;
const main = async () => {
  const org = process.env.ORG
  const repo = process.env.REPO

  await utils.registerSecrets()
  const appClient = await createGitHubAppClient()
  const client = await appClient.getInstallationOctokit(process.env.GH_APP_INSTALLATION_ID)
  await client.inactiveUsers.report(org, repo, notificationBody)
}

main().catch(err => {
  core.setFailed(err.message)
})
