const utils = require("../lib/utils");

const notificationBody = process.env.AUDIT_NOTIFICATION_BODY || `This organization automatically removes inactive users from its GitHub organization.  Your account has been inactive for 90 days and is pending removal.

 You can maintain access by responding to this issue or by making a commit, creating an issue or PR, or by commenting on something every 90 days. 
`;

(async function main() {
    const org = process.env.ORG
    const repo = process.env.REPO
    const appClient = await utils.createGitHubAppClient()
    const client = await appClient.getInstallationOctokit(process.env.GH_APP_INSTALLATION_ID)
    await client.inactiveUsers.report(org, repo, notificationBody)
})()
