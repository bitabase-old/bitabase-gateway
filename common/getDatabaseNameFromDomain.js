function getDatabaseNameFromDomain (matcher, domain) {
  const databaseMatches = domain.match(matcher);
  const databaseName = databaseMatches ? databaseMatches[1] : null;
  if (!databaseName) {
    return null;
  }

  const invalidDatabaseName = databaseName.match(/[^a-z0-9-]/gi, '');

  return !invalidDatabaseName ? databaseName : null;
}

module.exports = getDatabaseNameFromDomain;
