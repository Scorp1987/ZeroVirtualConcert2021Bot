const
    i18n = require('../i18n.config');
const
    botApi = require('../telegram/botApi'),
    help = require('../telegram/help');
const
    User = require('../types/user'),
    Payload = require('../types/payload'),
    { SUCCESS, USED, INVALID } = require('../types/ticketStatus');
const
    ticketDb = require('../database/ticket');

module.exports = class CheckTicket{
    static type = 'CHK';

    /**
     * 
     * @param {User} user 
     * @param {*} webhookEvent 
     * @param {Payload} payload 
     */
    constructor(user, webhookEvent, payload = null){
        this.user = user;
        this.webhookEvent = webhookEvent,
        this.payload = (payload) ? payload : new Payload(CheckTicket.type);
    }

    async handleNewPrivateMessageAsync(){
        this.payload.complete();
        await botApi.sendTextMessageAsync(this.user.telegram_id, i18n.__('check_ticket.not_allowed'));
    }

    /**
     * 
     * @param {number} chat_id 
     * @param {string} status 
     */
    async sendStatus(chat_id, status){
        if(status == USED)
            await botApi.sendMarkdownV2TextMessageAsync(chat_id, i18n.__('check_ticket.used'));
        else if(status == INVALID)
            await botApi.sendMarkdownV2TextMessageAsync(chat_id, i18n.__('check_ticket.invalid'));
        else if(status == SUCCESS)
            await botApi.sendMarkdownV2TextMessageAsync(chat_id, i18n.__('check_ticket.success'));
        else
            await botApi.sendMarkdownV2TextMessageAsync(chat_id, i18n.__('check_ticket.error'));
    }

    async handleAdminGroupMessageAsync(){
        const chat_id = this.webhookEvent.message.chat.id;
        const text = this.webhookEvent.message.text;

        const command = `/${CheckTicket.type.toLowerCase()}`;
        if(`${text}`.toLowerCase().startsWith(command)){
            const botUser = new User(await botApi.getMeAsync());
            const code = `${text}`.substring(command.length).trim();
            console.log(code);
            if(code)
                if(code.toLowerCase() != `@${botUser.telegram_user_name}`.toLowerCase()){
                    this.payload.complete();
                    const status = await ticketDb.useTicketAsync(code, this.user.telegram_id);
                    await this.sendStatus(chat_id, status);
                    return;
                }

            this.payload.step = 'ASK_CODE';
            await botApi.sendTextMessageAsync(chat_id, i18n.__('check_ticket.ask_code'));
            return;
        }

        switch(this.payload.step){
            case 'ASK_CODE':
                const code = text;
                this.payload.complete();
                const status = await ticketDb.useTicketAsync(code, this.user.telegram_id);
                await this.sendStatus(chat_id, status);
                break;
            default:
                this.payload.complete();
                help.sendUnexpectedError(chat_id, 'checkTicket.handleAdminGroupMessageAsync');
                break;
        }
    }
}