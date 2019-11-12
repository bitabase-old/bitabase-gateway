const test = require('tape')

const getCollectionNameFromPath = require('../../common/getCollectionNameFromPath')

test('getCollectionNameFromPath: has collection', t => {
  t.plan(1)

  const result = getCollectionNameFromPath('/someCollection')

  t.equal(result, 'someCollection')
})

test('getCollectionNameFromPath: has collection trailing slash', t => {
  t.plan(1)

  const result = getCollectionNameFromPath('/someCollection/')

  t.equal(result, 'someCollection')
})

test('getCollectionNameFromPath: has collection extra text', t => {
  t.plan(1)

  const result = getCollectionNameFromPath('/someCollection/extra')

  t.equal(result, 'someCollection')
})
