const fs = require("fs");

const low = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")

const adapter = new FileSync("db.json")
const db = low(adapter)

db.defaults({
    users: {},
    lastUpdated: ""
}).write()

exports.setLastUpdated = async (timestamp) => {
    await db.set(`lastUpdated`, timestamp).write()
}

exports.updateUser = async (login, createdAt, type, url) => {
    const existingUser = await getUser(login)
    if (existingUser) {
        const existingDate = new Date(existingUser.lastUpdated)
        const newDate = new Date(createdAt)
        if (newDate > existingDate) {
            existingUser["url"] = url
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
    const users = await db.get("users").value()
    const sortingFunction = (a, b) => a.localeCompare(b, undefined, {sensitivity: "base"}) // Performs a case-insensitive sort
    const sortedUsers = Object.keys(users).sort(sortingFunction) // Sort users alphabetically by login
    console.log("login,date,type,url")
    for (let userKey of sortedUsers) {
        const user = users[userKey]
        console.log(`${userKey},${user.lastUpdated},${user.type},${user.url ? user.url : "N/A"}`)
    }
}

exports.getExpiredUsers = async (users) => {
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() - 90)

    const expiredUsers = []
    const _users = await db.get("users").value()
    for (let user of users) {
        if (_users[user.login]) {
            if (!_users[user.login].hasOwnProperty("bot")) { // These are GitHub Apps, don't kick them
                const lastUpdated = new Date(_users[user.login].lastUpdated)
                if (lastUpdated < expirationDate) {
                    _users[user.login]["login"] = user.login
                    expiredUsers.push(_users[user.login])
                }
            }
        } else {
            expiredUsers.push({login: user.login, lastUpdated: "never", type: "none"})
        }
    }
    return expiredUsers
}

exports.reconcileUsers = async () => {
    const date = new Date()

    await fs.copyFileSync("db.json", `db-${date.toISOString().split("T")[0]}.json`)
    date.setDate(date.getDate() - 90)
    const users = await db.get("users").value()
    for (let userKey of Object.keys(users)) {
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
    return await db.get("lastUpdated").value()
}

const getUser = async (login) => {
    return await db.get(`users.${login}`).value()
}
