require('promises-debugger')({
  dimNodeModules: true,
  dimInternalModules: false,
  dimNotInProjectRoot: true,
  removeInternalModules: true
})

require('./common/getCollectionNameFromPath-test.js')
require('./common/getDatabaseNameFromDomain-test.js')
require('./integration/collection-test')
