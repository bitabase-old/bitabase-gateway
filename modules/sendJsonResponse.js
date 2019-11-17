function sendJsonResponse (statusCode, message, response) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json'
  });
  response.end(JSON.stringify(message, null, 2));
}

module.exports = sendJsonResponse;
