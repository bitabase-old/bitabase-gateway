function getCollectionNameFromPath (url) {
  const collectionName = url.split('/')[1];

  if (!collectionName) {
    return null;
  }

  const invalidCollectionName = collectionName.match(/[^a-z0-9]/gi, '');

  return !invalidCollectionName ? collectionName : null;
}

module.exports = getCollectionNameFromPath;
