class ErrorObject extends Error {
  constructor (obj) {
    super(obj.message || JSON.stringify(obj));

    Object.assign(this, obj);
  }
}

module.exports = ErrorObject;
