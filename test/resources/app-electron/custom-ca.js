// Optional environment variable for custom certificate authority
const CUSTOM_CA = process.env.CUSTOM_CA;

const SUCCESS = 0;
const USE_VERIFICATION_RESULT_FROM_CHROMIUM = -3;

function isCertAuthorityInvalid({ error }) {
  return error.toUpperCase()?.includes('ERR_CERT_AUTHORITY_INVALID');
}

function isRootCATrusted() {
  // Compare root CA of certificate with certificate authority file given by the user
  return !!CUSTOM_CA;
}

function isSafe({ error }) {
  return isCertAuthorityInvalid({ error }) && isRootCATrusted();
}

function installCustomCertificateAuthorities({ session }) {
  // Install custom CAs for main process and renderer process
  // See https://www.electronjs.org/docs/latest/api/session#sessetcertificateverifyprocproc
  session.defaultSession.setCertificateVerifyProc((request, callback) => {
    callback(isSafe({ error: request.verificationResult }) ? SUCCESS : USE_VERIFICATION_RESULT_FROM_CHROMIUM);
  });
}

module.exports = {
  installCustomCertificateAuthorities,
};
