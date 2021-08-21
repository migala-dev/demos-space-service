class FailMethods {
  constructor() {
    this.errors = {};
  }

  getErrors() {
    return this.errors;
  }

  setErrors(errors) {
    this.errors = { ...this.errors, ...errors };
  }

  cleanErrors() {
    this.errors = {};
  }
}

module.exports = new FailMethods();
