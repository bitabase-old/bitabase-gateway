const test = require('tape')

const getDatabaseNameFromDomain = require('../../common/getDatabaseNameFromDomain')

test('getDatabaseNameFromDomain: bad matcher, good domain', t => {
  t.plan(1)

  try {
    getDatabaseNameFromDomain('(.*????).example.com', 'test.example.com')
  } catch (error) {
    t.ok(error.message.includes('Invalid regular expression'))
  }
})

test('getDatabaseNameFromDomain: good matcher, good domain', t => {
  t.plan(1)

  const result = getDatabaseNameFromDomain('(.*?).example.com', 'test.example.com')
  t.equal(result, 'test')
})

test('getDatabaseNameFromDomain: good matcher, good domain, bad characters', t => {
  t.plan(1)

  const result = getDatabaseNameFromDomain('(.*?).example.com', 'te£st.example.com')
  t.equal(result, null)
})

test('getDatabaseNameFromDomain: good matcher, good domain, no subdomain', t => {
  t.plan(2)

  const resultNoSubdomain = getDatabaseNameFromDomain('(.*?).example.com', 'example.com')
  t.equal(resultNoSubdomain, null)

  const resultDotOnly = getDatabaseNameFromDomain('(.*?).example.com', '.example.com')
  t.equal(resultDotOnly, null)
})

test('getDatabaseNameFromDomain: good matcher, wrong domain', t => {
  t.plan(1)

  const result = getDatabaseNameFromDomain('(.*?).example.other', 'test.example.com')
  t.equal(result, null)
})
