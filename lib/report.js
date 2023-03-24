
const database = require('./database')
const utils = require('./utils')

exports.report = (octokit) => async (org, repo, body) => {
  console.log('Retrieving list of all organization users')
  const members = await octokit.paginate(octokit.orgs.listMembers, {
    org,
    role: 'member',
    per_page: 100
  })

  console.log('Retrieving all active issues')
  const _issues = await octokit.paginate(octokit.issues.listForRepo, {
    owner: org,
    repo,
    state: 'open',
    per_page: 100
  })

  const usernames = _issues.map(issue => issue.title.toLowerCase())

  const expiredUsers = await database.getExpiredUsers(members)
  console.log(`${expiredUsers.length} users found with no activity in the last ${database.INACTIVE_DURATION} days`)

  for (const expiredUser of expiredUsers) {
    if (expiredUser.login.toLowerCase().includes('-bot')) {
      console.log(`Skipping: ${expiredUser.login} is a bot account`)
      continue
    }
    if (usernames.includes(expiredUser.login.toLowerCase())) {
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
