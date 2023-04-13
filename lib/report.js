
const database = require('./database')
const utils = require('./utils')

exports.report = (octokit) => async (org, repo, body) => {
  const { members: orgMembers, userIssues, outsideCollaborators } = await octokit.inactiveUsers.getOrgMemberData(org, repo)
  
  const usersWithIssues = userIssues.map(issue => issue.title.toLowerCase())
  const members = orgMembers.concat(outsideCollaborators)
  
  console.log(`${members.length} users found in the organization (${orgMembers.length} members and ${outsideCollaborators.length} outside collaborators)`)

  const expiredUsers = await database.getExpiredUsers(members)
  console.log(`${expiredUsers.length} users found with no activity in the last ${database.INACTIVE_DURATION} days`)

  for (const expiredUser of expiredUsers) {
    if (expiredUser.login.toLowerCase().includes('-bot')) {
      console.log(`Skipping: ${expiredUser.login} is a bot account`)
      continue
    }
    if (usersWithIssues.includes(expiredUser.login.toLowerCase())) {
      console.log(`Skipping: ${expiredUser.login} already has an issue open`)
      continue
    }
    console.log(`Sending notification for ${expiredUser.login}`)
    if (process.env.DRY_RUN.toLowerCase() !== 'true') {
      await octokit.issues.create({
        owner: org,
        repo,
        title: expiredUser.login,
        labels: [utils.inactiveUserLabel],
        body: `@${expiredUser.login}\n\n ${body}`
      })
      await utils.sleep(3000)
    }
  }
}
