function CognitoUserAttribute(data) {
  const { Name, Value } = data;
  this.name = Name;
  this.value = Value;
}

module.exports = CognitoUserAttribute;
