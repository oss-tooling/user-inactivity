const database = require('./database')
const { inactiveUserLabel } = require('./utils')

const preserveAccountComment = (user) => {
  if (process.env.ISSUE_WITHOUT_MENTION.toLowerCase() === 'true') {
    return `Thank you, I will mark your account active.  Please remember this ${database.INACTIVE_DURATION} day audit will be part of the continuous monitoring for GitHub, so please maintain activity of one of the following to avoid be pulled as inactive again.
1. Commits
2. Created issue(s)
3. Created PR(s)
4. Commented on issues 
5. Commented on PR’s
The reports are run bi-weekly.`
  }

  return `@${user} Thank you, I will mark your account active.  Please remember this ${database.INACTIVE_DURATION} day audit will be part of the continuous monitoring for GitHub, so please maintain activity of one of the following to avoid be pulled as inactive again.
1. Commits
2. Created issue(s)
3. Created PR(s)
4. Commented on issues 
5. Commented on PR’s
The reports are run bi-weekly.`
}

const removeAccountComment = (user) => {
  return `@${user} you are being removed from the organization due to inactivity.`
}

const removeUserFromOrg = async (client, owner, login) => {
  await client.orgs.removeMembershipForUser({
    org: owner,
    username: login
  })
}

const removeCollaboratorFromOrg = async (client, owner, login) => {
  await client.orgs.removeOutsideCollaborator({
    org: owner,
    username: login
  })
}

const createComment = async (client, owner, repo, number, comment) => {
  if (process.env.DRY_RUN.toLowerCase() !== 'true') {
    await client.issues.createComment({
      owner: owner,
      repo: repo,
      issue_number: number,
      body: comment
    })
  }
}

const closeIssue = async (client, owner, repo, number) => {
  if (process.env.DRY_RUN.toLowerCase() !== 'true') {
    await client.issues.update({
      owner: owner,
      repo: repo,
      issue_number: number,
      state: 'closed'
    })
  }
}

const addLabels = async (client, owner, repo, number, labels) => {
  if (process.env.DRY_RUN.toLowerCase() !== 'true') {
    await client.issues.addLabels({
      owner: owner,
      repo: repo,
      issue_number: number,
      labels: labels
    })
  }
}

exports.kick = (octokit) => async (org, repo) => {
  const { members: orgMembers, userIssues: issues, outsideCollaborators:  outsideCollaboratorsRaw} = await octokit.inactiveUsers.getOrgMemberData(org, repo)
  
  const members = orgMembers.concat(outsideCollaboratorsRaw)
  const outsideCollaborators = outsideCollaboratorsRaw.map(collaborator => collaborator.login)

  const _expiredUsers = await database.getExpiredUsers(members)
  const expiredUsers = _expiredUsers.map(user => user.login)

  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() - 3)

  for (const issue of issues) {
    const username = issue.title

    const issueCreated = new Date(issue.created_at)
    if (issueCreated > expirationDate) {
      console.log(`Issue active, waiting to remove user: ${username}`)
      continue
    }

    if (issue.comments > 0) {
      const _comments = await octokit.paginate(octokit.issues.listComments, {
        owner: org,
        repo,
        issue_number: issue.number,
        per_page: 100
      })
      const commentsUserLogins = _comments.map(comment => comment.user.login)
      if (commentsUserLogins.includes(username)) {
        console.log(`Preserving user due to comment: ${username}`)
        await createComment(octokit, org, repo, issue.number, preserveAccountComment(username))
        await addLabels(octokit, org, repo, issue.number, ['preserved'])
        await closeIssue(octokit, org, repo, issue.number)
        continue
      }
    }

    const userExpired = username !== 'va-devops-bot' && expiredUsers.includes(username)
    if (userExpired) {
      console.log(`Removing user: ${username}`)
      if (outsideCollaborators.includes(username)) {
        await removeCollaboratorFromOrg(octokit, org, username)
      } else {
        await removeUserFromOrg(octokit, org, username)
      }
      await createComment(octokit, org, repo, issue.number, removeAccountComment(username))
      await addLabels(octokit, org, repo, issue.number, ['removed'])
      await closeIssue(octokit, org, repo, issue.number)
    } else {
      console.log(`Preserving user due to new activity: ${username}`)
      await createComment(octokit, org, repo, issue.number, preserveAccountComment(username))
      await addLabels(octokit, org, repo, issue.number, ['preserved'])
      await closeIssue(octokit, org, repo, issue.number)
    }
  }
}
