const utils = require("../lib/utils");

(async function main() {
    const org = process.env.ORG
    const repo = process.env.REPO
    const appClient = await utils.createGitHubAppClient()
    const client = await appClient.getInstallationOctokit(process.env.GH_APP_INSTALLATION_ID)
    await client.inactiveUsers.kick(org, repo)
})()
