const failMethods = require('../../utils/FailMethods');

function CognitoUserPool(data) {
  const { UserPoolId, ClientId } = data;
  this.userPoolId = UserPoolId;
  this.clientId = ClientId;
  this.signUp = jest.fn((_phoneNumber, _password, _attributeList, _x, callback) => {
    failMethods.setErrors({ userNotExist: false });
    callback(null, { user: {} });
  });
}

module.exports = CognitoUserPool;
