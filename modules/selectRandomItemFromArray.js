function selectRandomItemFromArray (array) {
  return array[Math.floor(Math.random() * array.length)];
}

module.exports = selectRandomItemFromArray;
