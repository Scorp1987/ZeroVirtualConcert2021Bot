const
    i18n = require('../i18n.config');
const
    botApi = require('../telegram/botApi'),
    help = require('../telegram/help');
const
    User = require('../types/user'),
    Payload = require('../types/payload');
const
    userDb = require('../database/user');

module.exports = class Language{
    static type = 'LANGUAGE';

    /**
     * 
     * @param {User} user 
     * @param {*} webhookEvent 
     * @param {Payload} payload 
     */
    constructor(user, webhookEvent, payload = null){
        this.user = user;
        this.webhookEvent = webhookEvent,
        this.payload = (payload) ? payload : new Payload(Language.type);
    }

    async handleCallbackQueryAsync(data){
        const chat_id = this.webhookEvent.callback_query.message.chat.id;
        const message_id = this.webhookEvent.callback_query.message.message_id;

        this.payload.complete();
        switch(data){
            case Language.type:
                await botApi.callMethodAsync('editMessageText',{
                    chat_id: chat_id,
                    message_id: message_id,
                    text: i18n.__('language.prompt'),
                    reply_markup: { inline_keyboard: [[{
                        text: i18n.__('menu.english'),
                        callback_data: `${Language.type}_ENGLISH`
                    },{
                        text: i18n.__('menu.myanmar'),
                        callback_data: `${Language.type}_MYANMAR`
                    }],[{
                        text: i18n.__('menu.back_main'),
                        callback_data: `${Language.type}_MAIN`
                    }]]}
                });
                break;
            case `${Language.type}_ENGLISH`:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('language.english_changed'));
                await userDb.updateLanguageAsync(this.user.telegram_id, 'en');
                i18n.setLocale('en');
                await help.sendHelpAsync(this.user);
                break;
            case `${Language.type}_MYANMAR`:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('language.myanmar_changed'));
                await userDb.updateLanguageAsync(this.user.telegram_id, 'my');
                i18n.setLocale('my');
                await help.sendHelpAsync(this.user);
                break;
            case `${Language.type}_MAIN`:
                await botApi.callMethodAsync('editMessageText', {
                    chat_id: chat_id,
                    message_id: message_id,
                    text: i18n.__('get_started.help', this.user),
                    reply_markup: { inline_keyboard: help.getHelpKeyboards() }
                });
                break;
        }
    }

    async handleNewPrivateMessageAsync(){
        const chat_id = this.webhookEvent.message.chat.id;
        const text = this.webhookEvent.message.text;

        if(`${text}`.toLowerCase() == `/${Language.type.toLowerCase()}`){
            await botApi.callMethodAsync('sendMessage',{
                chat_id: chat_id,
                text: i18n.__('language.prompt'),
                reply_markup: { inline_keyboard: [[{
                    text: i18n.__('menu.english'),
                    callback_data: `${Language.type}_ENGLISH`
                },{
                    text: i18n.__('menu.myanmar'),
                    callback_data: `${Language.type}_MYANMAR`
                }]]}
            });
            return;
        }
    }

    async handleAdminGroupMessageAsync(){
        this.payload.complete();
    }
}