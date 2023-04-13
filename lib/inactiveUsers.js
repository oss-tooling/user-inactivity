const { report } = require('./report')
const { kick } = require('./kick')
const { audit } = require('./audit')

exports.inactiveUsers = (octokit, options) => {
  return {
    inactiveUsers: {
      audit: audit(octokit, options),
      report: report(octokit, options),
      kick: kick(octokit, options),
      getOrgMemberData: async (org, issueRepo) => {
        const [ members, userIssues, outsideCollaborators ] = await Promise.all([
          octokit.paginate(octokit.orgs.listMembers, {
            org,
            role: 'member',
            per_page: 100
          }),
          octokit.paginate(octokit.issues.listForRepo, {
            owner: org,
            repo: issueRepo,
            state: 'open',
            per_page: 100,
          }),
          octokit.paginate(octokit.orgs.listOutsideCollaborators, {
            org,
            per_page: 100
          })
        ])
        return { members, userIssues, outsideCollaborators }
      }
    }
  }
}
