const ZendeskClient = require('zendesk-node-api')
const debug = require('debug')('slack-zendesk-slash-command:zendesk')

const zendesk = new ZendeskClient({
  url: process.env.ZENDESK_URL,
  email: process.env.ZENDESK_EMAIL,
  token: process.env.ZENDESK_API_TOKEN
})

const lookupZendeskUserId = (userEmail) => {
  return new Promise((resolve, reject) => {
    zendesk.search.list(`query=type:user email:${userEmail}`).then((result) => {
      debug('Zendesk user ID: %o', result[0].id)
      resolve(result[0].id)
    }).catch((err) => { reject(err) })
  })
}

const createZendeskTicket = (ticket) => {
  return new Promise((resolve, reject) => {
    zendesk.tickets.create({
      subject: ticket.subject,
      comment: {
        body: ticket.description
      },
      priority: ticket.priority,
      requester_id: ticket.zendeskUserId,
      type: ticket.type
    }).then((result) => {
      debug('Created Zendesk Ticket: %o', result.ticket)
      resolve(result.ticket.id)
    }).catch((err) => { reject(err) })
  })
}

module.exports = { lookupZendeskUserId, createZendeskTicket }
