const avoidJestOpenHandleError = () => {
  afterAll(async () => {
    await new Promise((resolve) => setTimeout(() => resolve(), 500)); // avoid jest open handle error
  });
};

module.exports = avoidJestOpenHandleError;
