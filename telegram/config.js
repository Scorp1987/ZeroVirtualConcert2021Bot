/**
 * Configuration for telegram
 * Written By:    Nathan Chen
 * Last Updated:  2021-11-16
 */

const ENV_VARS = [
    'BOT_API_URL',
    'BOT_TOKEN',
    'ADMIN_CHAT_ID'
];

module.exports = {
    // Telegram Bot API
    apiDomain: process.env.BOT_API_URL,

    // Telegram Bot Token
    botToken: process.env.BOT_TOKEN,

    // Base URL for Telegram API calls
    get apiUrl(){
        return `${this.apiDomain}/bot${this.botToken}`
    },

    // Telegram Admin Chat ID
    adminChatID: Number(process.env.ADMIN_CHAT_ID),

    checkEnvVariables: function(){
        ENV_VARS.forEach(function(key){
            if(!process.env[key]){
                console.warn(`WARNING: Missing the environment variable ${key}`);
            }
        })
    }
}