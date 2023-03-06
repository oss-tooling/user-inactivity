const {report} = require('./report')
const {kick} = require('./kick')
const {audit} = require('./audit')

exports.inactiveUsers = (octokit, options) => {
  return {
    inactiveUsers: {
      audit: audit(octokit, options),
      report: report(octokit, options),
      kick: kick(octokit, options)
    }
  }
}