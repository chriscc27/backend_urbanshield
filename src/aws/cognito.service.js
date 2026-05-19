const {
  SignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GlobalSignOutCommand,
  AdminGetUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { getCognitoClient } = require('./clients');
const { env } = require('../config/env');
const { AppError } = require('../errors/AppError');
const { HTTP_STATUS } = require('../constants/httpStatus');
const logger = require('../utils/logger');

/**
 * Servicio preparado para integración futura con Amazon Cognito.
 * Activar con USE_COGNITO=true en variables de entorno.
 */
class CognitoService {
  constructor() {
    this.client = getCognitoClient();
    this.userPoolId = env.cognito.userPoolId;
    this.clientId = env.cognito.clientId;
    this.enabled = env.cognito.useCognito;
  }

  ensureConfigured() {
    if (!this.enabled) {
      throw new AppError('Cognito integration is not enabled', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }
    if (!this.userPoolId || !this.clientId) {
      throw new AppError('Cognito is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }
  }

  async signUp({ email, password, name, role }) {
    this.ensureConfigured();
    try {
      const result = await this.client.send(
        new SignUpCommand({
          ClientId: this.clientId,
          Username: email,
          Password: password,
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'name', Value: name },
            { Name: 'custom:role', Value: role },
          ],
        }),
      );
      return result;
    } catch (error) {
      logger.error('Cognito signUp failed', { error: error.message });
      throw new AppError(error.message, HTTP_STATUS.BAD_REQUEST, 'AWS_SERVICE_ERROR');
    }
  }

  async signIn({ email, password }) {
    this.ensureConfigured();
    try {
      const result = await this.client.send(
        new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        }),
      );
      return result.AuthenticationResult;
    } catch (error) {
      logger.error('Cognito signIn failed', { error: error.message });
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED, 'INVALID_CREDENTIALS');
    }
  }

  async forgotPassword(email) {
    this.ensureConfigured();
    return this.client.send(
      new ForgotPasswordCommand({ ClientId: this.clientId, Username: email }),
    );
  }

  async confirmForgotPassword({ email, code, newPassword }) {
    this.ensureConfigured();
    return this.client.send(
      new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      }),
    );
  }

  async signOut(accessToken) {
    this.ensureConfigured();
    return this.client.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
  }

  async getUser(username) {
    this.ensureConfigured();
    return this.client.send(
      new AdminGetUserCommand({ UserPoolId: this.userPoolId, Username: username }),
    );
  }
}

module.exports = new CognitoService();
