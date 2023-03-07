const {Octokit} = require("@octokit/rest");
const {retry} = require("@octokit/plugin-retry");
const {throttling} = require("@octokit/plugin-throttling");

const database = require("./database")
const {App} = require("@octokit/app");
const {inactiveUsers} = require("./inactiveUsers")

const _Octokit = Octokit.plugin(retry, throttling, inactiveUsers)

exports.createGitHubAppClient = () => {
    return new App({
        appId: process.env.GH_APP_ID,
        privateKey: process.env.GH_APP_PRIVATE_KEY,
        Octokit: _Octokit.defaults({
            throttle: {
                onRateLimit: (retryAfter, options, octokit) => {
                    octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`)
                    if (options.request.retryCount <= 1) {
                        octokit.log.info(`Retrying after ${retryAfter} seconds!`)
                        return true
                    }
                },
                onSecondaryRateLimit: (retryAfter, options, octokit) => {
                    octokit.log.warn(`Abuse detected for request ${options.method} ${options.url}`)
                    return true
                }
            }
        })
    })
}

exports.getSince = async (days) => {
    if (days) {
        const d = new Date()
        d.setDate(d.getDate() - days)
        d.setHours(0, 0, 0, 0)
        return d.toISOString()
    }
    const lastUpdated = await database.getLastUpdated()
    return new Date(lastUpdated).toISOString()
}

exports.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

exports.inactiveUserLabel = "inactive-user"
