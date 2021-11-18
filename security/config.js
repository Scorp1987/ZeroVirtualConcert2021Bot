const crypto = require('./crypto_util');

const ENV_VARS = [
    'CRYPTO_TICKET_KEY'
];

module.exports = {
    ticketKey : Buffer.from(process.env.CRYPTO_TICKET_KEY, 'base64'),
    
    checkEnvVariables(){
        ENV_VARS.forEach(function(key){
            if(!process.env[key]){
                console.error(`Error: Missing the environment variable ${key}`);
                const randomKey = crypto.getRandomKey().toString('base64');
                console.log(`Random ${key}=${randomKey}`);
                process.exit(-1);
            }
        })
    }
}