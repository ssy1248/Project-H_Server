import { ErrorCodes } from './errorCodes.js';

export const handlerError = (socket, error) => {
  let responseCode;
  let message;
  console.error(error);

  if (error.code) {
    responseCode = error.code;
    message = error.message;
  } else {
    responseCode = ErrorCodes.SOCKET_ERROR;
    message = error.message;
  }
  console.error(`${responseCode} ${message}`);
};
