function AuthenticationDetails(data) {
  const { Username } = data;
  this.username = Username;
}

module.exports = AuthenticationDetails;
