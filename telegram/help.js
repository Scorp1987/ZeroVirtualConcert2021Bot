const
    i18n = require('../i18n.config');
const
    User = require('../types/user');
const
    config = require('./config'),
    botApi = require('./botApi');

module.exports = {
    /**
     * 
     * Send welcome message to user
     * @param {User} user 
     * 
     */
    async sendWelcomeAsync(user){
        const botUser = new User(await botApi.getMeAsync());
        await botApi.sendTextMessageAsync(user.telegram_id, i18n.__('get_started.welcome', {
            telegram_name: user.telegram_name,
            bot_name: botUser.telegram_name
        }));
    },

    /**
     * 
     * Send help message to user
     * @param {User} user
     * 
     */
    async sendHelpAsync(user){
        await botApi.callMethodAsync('sendMessage',{
            chat_id: user.telegram_id,
            text: i18n.__('get_started.help', user),
            reply_markup: { inline_keyboard: this.getHelpKeyboards() }
        });
    },

    /**
     * 
     * @param {number} telegram_id 
     * 
     * Send any fallback error to user
     */
    async sendAnyFallbackAsync(telegram_id){
        await botApi.sendTextMessageAsync(telegram_id, i18n.__('fallback.any'));
    },

    getHelpKeyboards(){
        return [[{
            text: i18n.__('menu.language'),
            callback_data: 'LANGUAGE'
        }],[{
            text: i18n.__('menu.ticket'),
            callback_data: 'TICKET'
        }]];
    },

    /**
     * @param {number} telegram_user_id
     * @param {string} path
     */
    sendUnexpectedError(telegram_user_id, path){
        botApi.sendTextMessageAsync(config.adminChatID, `Unexpected workflow path at ${path}`);
        if(telegram_user_id)  
            botApi.sendTextMessageAsync(telegram_user_id, i18n.__('fallback.unexpected'));
    },

    /**
     * 
     * @param {number} telegram_user_id
     * @param {string} path
     * @param {Payload} payload
     * 
     * Send any server error to user and admin group
     */
    sendServerErrorAsync(telegram_user_id, path, payload){
        botApi.sendTextMessageAsync(config.adminChatID, JSON.stringify({
            message: `error occured at ${path}`,
            user_id: telegram_user_id,
            paylaod: payload
        }));
        if(telegram_user_id)
            botApi.sendTextMessageAsync(telegram_user_id, i18n.__('fallback.server_error'));
    },
}