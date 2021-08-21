const CognitoUserPool = require('./CognitoUserPool');
const AuthenticationDetails = require('./AuthenticationDetails');
const CognitoUser = require('./CognitoUser');
const CognitoUserAttribute = require('./CognitoUserAttribute');

module.exports = {
  CognitoUserPool: jest.fn().mockImplementation(CognitoUserPool),
  AuthenticationDetails: jest.fn().mockImplementation(AuthenticationDetails),
  CognitoUser: jest.fn().mockImplementation(CognitoUser),
  CognitoUserAttribute: jest.fn().mockImplementation(CognitoUserAttribute),
};
