# User Inactivity

Automation that helps GitHub Enterprise Administrators monitor and remove inactive members from a GitHub organization.

## How does it work?

The tool is completely driven by actions which perform three main tasks:

1. Audit - Analyze the enterprise audit log for the last activity performed by each user and stores a record of the activity in a json file.
2. Report - Analyzes the json log from step 1 and creates an issue to notify each user with no activity within 90 days that they will be removed from the organization if they do not perform an action.  Users can simply reply to the issue to preserve their account.
3. Kick - Removes inactive users from the organization and closes notification issues.

## Set up

The quickest way to use this project is by copying the [template repository](https://github.com/oss-tooling/user-inactivity-template) and following the installation instructions.

