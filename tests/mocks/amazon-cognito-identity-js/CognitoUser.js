const failMethods = require('../../utils/FailMethods');

function CognitoUser(data) {
  const { Username } = data;
  const originalSession = 'session-mock-token';
  this.username = Username;
  this.Session = originalSession;
  this.setAuthenticationFlowType = jest.fn().mockReturnValue('auth');
  this.initiateAuth = jest.fn((authDetails, callbacks) => {
    const errorsOn = failMethods.getErrors();
    if (!errorsOn.userNotExist) {
      callbacks.customChallenge();
    } else {
      callbacks.onFailure({ message: 'User does not exist' });
    }
  });
  this.sendCustomChallengeAnswer = jest.fn((answerChallenge, callbacks) => {
    if (originalSession !== this.Session) {
      callbacks.onFailure({ message: 'Not a valid session' });
    } else {
      const tokenObject = {
        getAccessToken: () => ({
          getJwtToken: () => 'jwt-token-mock',
        }),
        getRefreshToken: () => ({
          getToken: () => 'refresh-token-mock',
        }),
      };
      callbacks.onSuccess(tokenObject);
    }
  });
}

module.exports = CognitoUser;
