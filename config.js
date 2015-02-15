exports.vso = {
    authorizationURL: 'https://app.vssps.visualstudio.com/oauth2/authorize',
    tokenURL: 'https://app.vssps.visualstudio.com/oauth2/token',
    clientId: '89145742-D36F-44B2-BD18-A0023296C673',
    clientSecret: process.env.VSO_SECRET,
    callbackURL: 'https://chakraviz.azurewebsites.net/auth/provider/callback',
    scopes: 'vso.build_execute vso.chat_manage vso.code_manage vso.test_write vso.work_write'
}

exports.docdb = {
    host: 'https://chakraviz.documents.azure.com:443/',
    masterKey: process.env.DOCDB_KEY 
}
