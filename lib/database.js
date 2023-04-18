const fs = require('fs')

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

const INACTIVE_DURATION = process.env.INACTIVE_DURATION && Number(process.env.INACTIVE_DURATION) || 30

db.defaults({
  users: {},
  lastUpdated: ''
}).write()

exports.INACTIVE_DURATION = INACTIVE_DURATION

exports.setLastUpdated = async (timestamp) => {
  await db.set('lastUpdated', timestamp).write()
}

exports.updateUser = async (login, createdAt, type, url) => {
  const existingUser = await getUser(login)
  if (existingUser) {
    const existingDate = new Date(existingUser.lastUpdated)
    const newDate = new Date(createdAt)
    if (newDate > existingDate) {
      existingUser.url = url
      existingUser.lastUpdated = createdAt
      existingUser.type = type
      await db.set(`users.${login}`, existingUser).write()
    }
  } else {
    const newUser = {
      url: url,
      lastUpdated: createdAt,
      type: type
    }
    await db.set(`users.${login}`, newUser).write()
  }
}

exports.generateCSV = async () => {
  const users = await db.get('users').value()
  const sortingFunction = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }) // Performs a case-insensitive sort
  const sortedUsers = Object.keys(users).sort(sortingFunction) // Sort users alphabetically by login
  console.log('login,date,type,url')
  for (const userKey of sortedUsers) {
    const user = users[userKey]
    console.log(`${userKey},${user.lastUpdated},${user.type},${user.url ? user.url : 'N/A'}`)
  }
}

exports.getExpiredUsers = async (users) => {
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() - INACTIVE_DURATION)

  // log the expirationDate
  console.log(`Expiration date: ${expirationDate}`)

  const expiredUsers = []
  const _users = await db.get('users').value()

  // log the _users
  console.log(`_users: ${_users}`)

  for (const user of users) {
    if (_users[user.login]) {
      if (!_users[user.login].hasOwnProperty('bot')) { // These are GitHub Apps, don't kick them
        const lastUpdated = new Date(_users[user.login].lastUpdated)
        // log the lastUpdated time and print the last Updated date from the db
        console.log(`computed lastUpdated: ${lastUpdated}, user last updated time: ${_users[user.login].lastUpdated}`)

        if (lastUpdated < expirationDate) {
          _users[user.login].login = user.login
          expiredUsers.push(_users[user.login])
        }
      }
    } else {
      // log the user login
      console.log(`User not in _users: ${user.login}`)
      expiredUsers.push({ login: user.login, lastUpdated: 'never', type: 'none' })
    }
  }
  return expiredUsers
}

exports.reconcileUsers = async () => {
  const date = new Date()

  await fs.copyFileSync('db.json', `db-${date.toISOString().split('T')[0]}.json`)
  date.setDate(date.getDate() - INACTIVE_DURATION)
  const users = await db.get('users').value()
  for (const userKey of Object.keys(users)) {
    const user = users[userKey]
    if (user.bot) {
      console.log(`Removing app user from database: ${userKey}`)
      await db.unset(`users.${userKey}`).write()
      continue
    }
    const lastUpdated = new Date(user.lastUpdated)
    if (lastUpdated < date) {
      console.log(`Removing expired user from database: ${userKey}`)
      await db.unset(`users.${userKey}`).write()
    }
  }
}

exports.getLastUpdated = async () => {
  return await db.get('lastUpdated').value()
}

const getUser = async (login) => {
  return await db.get(`users.${login}`).value()
}

exports.getExpiredUsers([{login: 'garnertb', lastUpdated: "2023-04-03T14:23:17.062Z"}]).then(res => {
  console.log(res, process.env.INACTIVE_DURATION)
})
