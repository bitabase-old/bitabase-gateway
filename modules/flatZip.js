function flatZip (sources, limit) {
  const result = [];
  const lengths = sources.map(source => source.length);
  const maxLength = Math.max(...lengths);

  for (let i = 0; i <= maxLength && result.length < limit; i++) {
    sources.forEach(function (source, index) {
      if (source[i] && result.length < limit) {
        result.push(source[i]);
      }
    });
  }

  return result;
}

module.exports = flatZip;
