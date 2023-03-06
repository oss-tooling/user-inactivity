const utils = require("../lib/utils");

(async function main() {
    const appClient = await utils.createGitHubAppClient()
    const client = await appClient.getInstallationOctokit(process.env.GH_APP_INSTALLATION_ID)
    const since = await utils.getSince(7)
    await client.inactiveUsers.audit(process.env.ORG, since)
})()
