const database = require("./database");

exports.audit = (octokit) => async (org, since) => {
  const auditsLastUpdated = new Date()
  const query = `created:>=${since}`
  console.log(`Fetching audit log for ${org} since ${since}`)

  const processed = {};
  // https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/orgs?apiVersion=2022-11-28#get-the-audit-log-for-an-organization
  for await (const page of octokit.paginate.iterator('GET /orgs/{org}/audit-log', {
    org,
    include: 'all',
    phrase: query,
    per_page: 100,
    order: 'desc'
  })) {
    for await (const entry of page.data) {
      if (processed[entry.actor] || !entry.actor) {
        console.log(`Already processed actor: ${entry.actor}`)
        continue
      }

      const timestamp = new Date(entry['@timestamp'])
      console.log(`User found: ${entry.actor}, timestamp ${timestamp}`)
      await database.updateUser(entry.actor, timestamp, entry.action)

      processed[entry.actor] = true
      console.log(processed)
    }

    if (process.env.BREAK_ON_FIRST_PAGE) { 
      //break for debugging purposes
      break
    }
  }
  await database.setLastUpdated(auditsLastUpdated.toISOString())
}