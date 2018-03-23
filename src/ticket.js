const axios = require('axios')
const debug = require('debug')('slack-zendesk-slash-command:ticket')
const qs = require('querystring')
const users = require('./users')
const zendesk = require('./zendesk')

/*
 *  Send ticket creation confirmation via
 *  chat.postMessage to the user who created it
 */
const sendConfirmation = (ticket) => {
  axios.post('https://slack.com/api/chat.postMessage', qs.stringify({
    token: process.env.SLACK_ACCESS_TOKEN,
    channel: ticket.userId,
    text: 'Support ticket created!',
    attachments: JSON.stringify([
      {
        title: ticket.zendeskTicketId,
        title_link: ticket.zendeskTicketUrl,
        text: ticket.text,
        fields: [
          {
            title: 'Submitter',
            value: ticket.userEmail
          },
          {
            title: 'Subject',
            value: ticket.subject
          },
          {
            title: 'Description',
            value: ticket.description
          },
          {
            title: 'Status',
            value: 'Open',
            short: true
          },
          {
            title: 'Priority',
            value: ticket.priority,
            short: true
          },
          {
            title: 'Type',
            value: ticket.type,
            short: true
          }
        ]
      }
    ])
  })).then((result) => {
    debug('sendConfirmation: %o', result.data)
  }).catch((err) => {
    debug('sendConfirmation error: %o', err)
    debug(err)
  })
}

/*
 * Update ticket with Slack and Zendesk details (like user), and submit.
 */
const submit = async (userId, ticket) => {
  try {
    const userEmail = await users.lookupSlackUserEmail(userId)
    const myTicket = { ...ticket, userEmail }
    myTicket.zendeskUserId = await zendesk.lookupZendeskUserId(userEmail)
    const zendeskTicketId = await zendesk.createZendeskTicket(myTicket)
    myTicket.zendeskTicketId = `PPS-${zendeskTicketId}`
    myTicket.zendeskTicketUrl = `https://support.atomicobject.com/hc/en-us/requests/${zendeskTicketId}`
    sendConfirmation(myTicket)
  } catch (err) {
    debug('Error: %o', err)
  }
}

/*
 * Construct initial ticket from submission
 */
const create = (userId, submission) => {
  const ticket = {}
  ticket.userId = userId
  ticket.subject = submission.subject
  ticket.description = submission.description
  ticket.priority = submission.priority
  ticket.type = submission.type
  submit(userId, ticket)
}

module.exports = { create, sendConfirmation }
