const database = require('./database')

exports.audit = (octokit) => async (org, since) => {
  const auditsLastUpdated = new Date()
  const query = `created:>=${since}`

  const processed = {}
  const payload = {
    org,
    include: 'all',
    phrase: query,
    per_page: 100,
    order: 'desc'
  }

  console.log(`Fetching audit log for ${org} since ${since}`)
  // https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/orgs?apiVersion=2022-11-28#get-the-audit-log-for-an-organization
  await octokit.paginate('GET /orgs/{org}/audit-log', payload, async (response, done) => {
    for (const entry of response.data) {
      if (processed[entry.actor] || !entry.actor) {
        continue
      }

      const timestamp = new Date(entry['@timestamp'])
      console.log(`User found: ${entry.actor}, timestamp ${timestamp}`)
      await database.updateUser(entry.actor, timestamp, entry.action)

      processed[entry.actor] = true
    }

    if (process.env.BREAK_ON_FIRST_PAGE) {
      // break for debugging purposes
      done()
    }
  })

  await database.setLastUpdated(auditsLastUpdated.toISOString())
}
