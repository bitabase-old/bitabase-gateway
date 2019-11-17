const setCrossDomainOriginHeaders = (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', request.headers.origin || '*');
  response.setHeader('Access-Control-Allow-Headers', [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'X-Session-Id',
    'X-Session-Secret'
  ].join(', '));
};

module.exports = setCrossDomainOriginHeaders;
