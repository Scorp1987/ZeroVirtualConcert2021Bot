/**
 * Configuration for telegram
 * Written By:    Nathan Chen
 * Last Updated:  2021-11-16
 */

 const ENV_VARS = [
    'TELEGRAM_URL',
    'AUTHORIZATION_URL',
    'LOG_URL',
    'USER_URL',
    'TICKET_URL',
    'PAYMENT_URL',
    'OWNER_TOKEN',
    'OWNER_NAME'
];

module.exports = {
    // Telegram Endpoint
    telegramUrl: process.env.TELEGRAM_URL,

    authorizationUrl: process.env.AUTHORIZATION_URL,

    logUrl: process.env.LOG_URL,

    userUrl: process.env.USER_URL,

    ticketUrl: process.env.TICKET_URL,

    paymentUrl: process.env.PAYMENT_URL,

    ownerToken: process.env.OWNER_TOKEN,

    ownerName: process.env.OWNER_NAME,

    checkEnvVariables: function(){
        ENV_VARS.forEach(function(key){
            if(!process.env[key]){
                console.warn(`WARNING: Missing the environment variable ${key}`);
            }
        })
    }
}