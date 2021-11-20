const
    i18n = require('../i18n.config'),
    { replaceNumber } = require('../helper');
const
    User = require('../types/user'),
    Payload = require('../types/payload'),
    { STARTED, ASK_CURRENCY, ASK_METHOD, ASK_COUNT, ASK_AMOUNT, CONFIRMATION, ASK_PICTURE } = require('../types/donationStep');
const
    userDb = require('../database/user'),
    ticketDb = require('../database/ticket');
const
    botConfig = require('../telegram/config'),
    botApi = require('../telegram/botApi'),
    help = require('../telegram/help');
const
    config = require('./config');

module.exports = class Ticket{
    static type = 'TICKET';

    /**
     * 
     * @param {User} user 
     * @param {*} webhookEvent 
     * @param {Payload} payload 
     */
    constructor(user, webhookEvent, payload = null){
        this.user = user;
        this.webhookEvent = webhookEvent,
        this.payload = (payload) ? payload : new Payload(Ticket.type);
    }

    async isCorrectStepAsync(step){
        if(this.payload.step == step) return true;
        this.payload.complete();
        await botApi.sendTextMessageAsync(this.user.telegram_id, i18n.__('ticket.invalid_step'));
        await help.sendHelpAsync(this.user);
        await botApi.sendTextMessageAsync(botConfig.adminChatID, JSON.stringify({
            error: 'Ticket.InvalidStep',
            user: this.user,
            event: this.webhookEvent,
            payload: this.payload
        }));
        return false;
    }

    /**
     * 
     * @param {string} count 
     */
    isCountValid(count){
        if(isNaN(count)) return false;
        if(count < 1 || count > this.payload.max_count) return false;
        return true;
    }

    /**
     * 
     * @param {string} amount 
     * @returns 
     */
    isAmountValid(amount){
        if(isNaN(amount)) return false;
        if(amount < this.payload.amount) return false;
        return true;
    }

    /**
     * Send Ask Currency Message
     */
    async askCurrencyAsync(){
        this.payload.step = ASK_CURRENCY;
        await botApi.callMethodAsync('sendMessage', {
            chat_id: this.user.telegram_id,
            text: i18n.__('ticket.ask_currency'),
            reply_markup: { inline_keyboard: [[{
                text: i18n.__('menu.currency_sgd'),
                callback_data: `${Ticket.type}_SGD`
            }],[{
                text: i18n.__('menu.currency_usd'),
                callback_data: `${Ticket.type}_USD`
            }],[{
                text: i18n.__('menu.currency_mmk'),
                callback_data: `${Ticket.type}_MMK`
            }]]}
        });
    }

    /**
     * Send Ask Method Message
     */
    async askSgdMethodAsync(){
        this.payload.step = ASK_METHOD;
        await botApi.callMethodAsync('sendMessage',{
            chat_id: this.user.telegram_id,
            text: i18n.__('ticket.ask_method'),
            reply_markup: { inline_keyboard: [[{
                text: i18n.__('menu.method_paynow'),
                callback_data: `${Ticket.type}_PAYNOW`
            },{
                text: i18n.__('menu.method_paylah'),
                callback_data: `${Ticket.type}_PAYLAH`
            }]]}
        });
    }

    /**
     * Send Ask Method Message
     */
    async askUsdMethodAsync(){
        this.payload.step = ASK_METHOD;
        await botApi.callMethodAsync('sendMessage',{
            chat_id: this.user.telegram_id,
            text: i18n.__('ticket.ask_method'),
            reply_markup: { inline_keyboard: [[{
                text: i18n.__('menu.method_paypal'),
                callback_data: `${Ticket.type}_PAYPAL`
            }]]}
        });
    }

    /**
     * Send Ask to Contact Message
     */
    async askContactAsync(){
        await botApi.callMethodAsync('sendMessage', {
            chat_id: this.user.telegram_id,
            text: i18n.__('ticket.ask_contact',{
                currency: botApi.getMarkdownV2Text(this.payload.currency),
                cost: botApi.getMarkdownV2Text(this.payload.cost)
            }),
            parse_mode: 'MarkdownV2',
            reply_markup: { inline_keyboard: [[{
                text: i18n.__('menu.contact'),
                url: config.link_messenger
            }]]}
        });
    }

    async askCountAsync(){
        this.payload.step = ASK_COUNT;
        await botApi.sendMarkdownV2TextMessageAsync(this.user.telegram_id, i18n.__('ticket.ask_count', {
            currency: botApi.getMarkdownV2Text(this.payload.currency),
            cost: botApi.getMarkdownV2Text(this.payload.cost),
            max_count: this.payload.max_count
        }));
    }

    async askAmountAsync(){
        this.payload.step = ASK_AMOUNT;
        await botApi.sendMarkdownV2TextMessageAsync(this.user.telegram_id, i18n.__('ticket.ask_amount', {
            count: this.payload.count,
            currency: botApi.getMarkdownV2Text(this.payload.currency),
            amount: botApi.getMarkdownV2Text(this.payload.amount)
        }));
    }

    /**
     * Send Confirmation Message
     */
    async confirmationAsync(){
        this.payload.step = CONFIRMATION;
        await botApi.callMethodAsync('sendMessage',{
            chat_id: this.user.telegram_id,
            text: i18n.__('ticket.confirmation', {
                method: botApi.getMarkdownV2Text(this.payload.method),
                count: this.payload.count,
                currency: botApi.getMarkdownV2Text(this.payload.currency),
                amount: botApi.getMarkdownV2Text(this.payload.amount)
            }),
            parse_mode: 'MarkdownV2',
            reply_markup: { inline_keyboard: [[{
                text: i18n.__('menu.correct'),
                callback_data: `${Ticket.type}_CONF_COR_${this.payload.method}_${this.payload.count}_${this.payload.amount}`
            },{
                text: i18n.__('menu.wrong'),
                callback_data: `${Ticket.type}_CONF_WRG`
            }]]}
        });
    }

    async sendPaymentInfo(){
        await botApi.sendMarkdownV2TextMessageAsync(this.user.telegram_id, i18n.__('ticket.send_payment_info', {
            currency: botApi.getMarkdownV2Text(this.payload.currency),
            amount: botApi.getMarkdownV2Text(this.payload.amount),
            payment_info: botApi.getMarkdownV2Text(this.payload.payment_info)
        }));
    }

    async askPictureAsync(){
        this.payload.step = ASK_PICTURE;
        await botApi.sendTextMessageAsync(this.user.telegram_id, i18n.__('ticket.ask_picture'));
    }

    /**
     * 
     * @param {string} type 
     * @param {number} payment_id
     */
    async informAdminAsync(type, payment_id){
        const obj = {
            chat_id: botConfig.adminChatID,
            caption: i18n.__('ticket.inform_admin', this.payload),
            reply_markup: { inline_keyboard: [[{
                text: i18n.__('menu.received'),
                callback_data: `${Ticket.type}_REC_${payment_id}`
            },{
                text: i18n.__('menu.dont_received'),
                callback_data: `${Ticket.type}_DON_REC_${payment_id}`
            }],[{
                text: i18n.__('menu.contact'),
                callback_data: `${Ticket.type}_CON_${payment_id}`
            }]]}
        };
        obj[type] = this.payload.telegram_file_id;

        await botApi.callMethodAsync(`send${type}`, obj);
    }

    async updateInformAdminAsync(payment_id){
        await botApi.callMethodAsync('editMessageReplyMarkup', {
            chat_id: this.webhookEvent.callback_query.message.chat.id,
            message_id: this.webhookEvent.callback_query.message.message_id,
            reply_markup: { inline_keyboard: [[{
                text: i18n.__('menu.contact'),
                callback_data: `${Ticket.type}_CON_${payment_id}`
            }]]}
        });
    }

    async informReceiveAsync(payment){
        await botApi.sendMarkdownV2TextMessageAsync(payment.telegram_id, i18n.__('ticket.inform_received', {
            currency: botApi.getMarkdownV2Text(payment.currency),
            amount: botApi.getMarkdownV2Text(payment.amount)
        }));
    }    

    async informDontReceiveAsync(payment){
        await botApi.callMethodAsync('sendMessage', {
            chat_id: payment.telegram_id,
            text: i18n.__('ticket.inform_dont_received', {
                currency: botApi.getMarkdownV2Text(payment.currency),
                amount: botApi.getMarkdownV2Text(payment.amount)
            }),
            reply_markup: { inline_keyboard: [[{
                text: i18n.__('menu.contact'),
                url: config.link_messenger
            }]]}
        });
    }

    /**
     * 
     * @param {Payment} payment 
     */
    async informContactAsync(payment){
        await botApi.callMethodAsync('sendMessage', {
            chat_id: payment.telegram_id,
            parse_mode: 'MarkdownV2',
            text: i18n.__('ticket.inform_contact', {
                currency: botApi.getMarkdownV2Text(payment.currency),
                amount: botApi.getMarkdownV2Text(payment.amount)
            }),
            reply_markup: { inline_keyboard: [[{
                text: i18n.__('menu.contact'),
                url: config.link_messenger
            }]]}
        });
    }

    /**
     * 
     * @param {Payment} payment 
     */
    async sendJoinGroupAsync(payment){
        await botApi.sendTextMessageAsync(payment.telegram_id, i18n.__('ticket.send_join_group', payment));
    }

    async sendClosingAsync(payment){
        await botApi.callMethodAsync('sendMessage', {
            chat_id: payment.telegram_id,
            text: i18n.__('ticket.closing'),
            reply_markup: { inline_keyboard: [[{
                text: i18n.__('menu.join_group'),
                url: config.link_group
            }],[{
                text: i18n.__('menu.contact'),
                url: config.link_messenger
            }]]}
        })
    }

    /**
     * 
     * @param {string} data 
     * @returns 
     */
    async handleCallbackQueryAsync(data){
        if(data.startsWith(`${Ticket.type}_CONF_COR_`)){
            await botApi.removeReplyMarkupAsync(this.webhookEvent);

            const str = data.substring(`${Ticket.type}_CONF_COR_`.length);
            const arr = str.split('_');

            this.payload.telegram_id = this.user.telegram_id;
            this.payload.telegram_name = this.user.telegram_name;
            this.payload.max_count = config.max_count;
            this.payload.method = arr[0];
            this.payload.currency = (arr[0]=='PayPal') ? 'USD' : 'SGD';
            this.payload.cost = (arr[0]=='PayPal') ? config.cost_usd : config.cost_sgd;
            this.payload.payment_info = (arr[0]=='PayNow') ? config.info_paynow : (arr[0]=='PayLah') ? config.info_paylah : config.info_paypal;
            this.payload.count = parseInt(arr[1]);
            this.payload.amount = parseFloat(arr[2]);
            await this.sendPaymentInfo();
            await this.askPictureAsync();
        }
        else if(data.startsWith(`${Ticket.type}_REC_`)){
            const payment_id = data.substring(`${Ticket.type}_REC_`.length);
            await this.updateInformAdminAsync(payment_id);
            this.payload.complete();
            let payment = await ticketDb.getPaymentByIdAsync(payment_id);
            if(!payment.verified_date){
                payment = await ticketDb.verifyPaymentAsync(payment_id, this.user.telegram_id);
                const tickets = await ticketDb.addTicketsAsync(payment.count, payment.payment_id);
                const user = await userDb.getUserByIdAsync(payment.telegram_id);
                i18n.setLocale(user.language);
                await this.informReceiveAsync(payment);
                await this.sendJoinGroupAsync(payment);
                for(let i=0; i<tickets.length; i++)
                    await botApi.sendTextMessageAsync(payment.telegram_id, tickets[i].code);
                await this.sendClosingAsync(payment);
            }
        }
        else if(data.startsWith(`${Ticket.type}_DON_REC_`)){
            const payment_id = data.substring(`${Ticket.type}_DON_REC_`.length);
            await this.updateInformAdminAsync(payment_id);
            this.payload.complete();
            let payment = await ticketDb.getPaymentByIdAsync(payment_id);
            if(!payment.verified_date){
                const user = await userDb.getUserByIdAsync(payment.telegram_id);
                i18n.setLocale(user.language);
                await this.informDontReceiveAsync(payment);
                await help.sendHelpAsync(user);
            }
        }
        else if(data.startsWith(`${Ticket.type}_CON_`)){
            this.payload.complete();
            const payment_id = data.substring(`${Ticket.type}_CON_`.length);
            const payment = await ticketDb.getPaymentByIdAsync(payment_id);
            const user = await userDb.getUserByIdAsync(payment.telegram_id);
            i18n.setLocale(user.language);
            await this.informContactAsync(payment);
        }
        else{
            let menu;
            switch(data){
                case Ticket.type:
                    await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.ticket'));
                    this.payload.complete();
                    await this.askCurrencyAsync();
                    break;
                case `${Ticket.type}_SGD`:
                    await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.currency_sgd'));
                    this.payload.complete();
                    await this.askSgdMethodAsync();
                    break;
                case `${Ticket.type}_USD`:
                    await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.currency_usd'));
                    this.payload.complete();
                    await this.askUsdMethodAsync();
                    break;
                case `${Ticket.type}_MMK`:
                    await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.currency_mmk'));
                    this.payload.complete();
                    this.payload.currency = 'MMK';
                    this.payload.cost = config.cost_mmk;
                    await this.askContactAsync();
                    await help.sendHelpAsync(this.user);
                    break;
                case `${Ticket.type}_PAYNOW`:
                case `${Ticket.type}_PAYLAH`:
                case `${Ticket.type}_PAYPAL`:
                    menu = (data==`${Ticket.type}_PAYNOW`) ? 'menu.method_paynow' : (data==`${Ticket.type}_PAYLAH`) ? 'menu.method_paylah' : 'menu.method_paypal';
                    await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__(menu));
    
                    // if(!(await this.isCorrectStepAsync(ASK_METHOD))) return;
    
                    this.payload.telegram_id = this.user.telegram_id;
                    this.payload.telegram_name = this.user.telegram_name;
                    this.payload.max_count = config.max_count;
                    this.payload.currency = (data==`${Ticket.type}_PAYPAL`) ? 'USD' : 'SGD';
                    this.payload.cost = (data==`${Ticket.type}_PAYPAL`) ? config.cost_usd : config.cost_sgd;
                    this.payload.method = (data==`${Ticket.type}_PAYNOW`) ? 'PayNow' : (data==`${Ticket.type}_PAYLAH`) ? 'PayLah' : 'PayPal';
                    this.payload.payment_info = (data==`${Ticket.type}_PAYNOW`) ? config.info_paynow : (data==`${Ticket.type}_PAYLAH`) ? config.info_paylah : config.info_paypal;
                    await this.askCountAsync();
                    break;
                case `${Ticket.type}_CONF_COR`:
                    await botApi.removeReplyMarkupAsync(this.webhookEvent);
                    
                    if(!(await this.isCorrectStepAsync(CONFIRMATION))) return;
    
                    await this.sendPaymentInfo();
                    await this.askPictureAsync();
                    break;
                case `${Ticket.type}_CONF_WRG`:
                    await botApi.removeReplyMarkupAsync(this.webhookEvent);
                    this.payload.complete();
                    await this.askCurrencyAsync();
                    break;
                default:
                    await this.isCorrectStepAsync('');
                    break;
            }
        }
    }

    /**
     * 
     */
    async handleNewPrivateMessageAsync(){
        const text = this.webhookEvent.message.text;

        if(`${text}`.toLowerCase() == `/${Ticket.type.toLowerCase()}`){
            this.payload.telegram_id = this.user.telegram_id;
            this.payload.telegram_name = this.user.telegram_name;
            this.payload.max_count = config.max_count;
            await this.askCurrencyAsync();
            return;
        }

        switch(this.payload.step){
            case ASK_COUNT:
                const count = replaceNumber(text);
                if(!this.isCountValid(count)){
                    await botApi.sendTextMessageAsync(this.user.telegram_id, i18n.__('ticket.invalid_count', this.payload));
                    await this.askCountAsync();
                }
                else{
                    this.payload.count = parseInt(count);
                    this.payload.amount = this.payload.count * this.payload.cost;
                    await this.askAmountAsync();
                }
                break;
            case ASK_AMOUNT:
                const amount = replaceNumber(text);
                if(!this.isAmountValid(amount)){
                    await botApi.sendMarkdownV2TextMessageAsync(this.user.telegram_id, i18n.__('ticket.invalid_amount', this.payload));
                    await this.askAmountAsync();
                }
                else{
                    this.payload.amount = parseFloat(amount);
                    await this.confirmationAsync();
                }
                break;
            case ASK_PICTURE:
				const document = this.webhookEvent.message.document;
				const photos = this.webhookEvent.message.photo;
                if(Array.isArray(photos))
                    this.payload.telegram_file_id = photos[photos.length-1].file_id;
                else if(document)
                    this.payload.telegram_file_id = document.file_id;
                else{
                    await botApi.sendTextMessageAsync(this.user.telegram_id, i18n.__('ticket.invalid_picture'));
                    await this.askPictureAsync();
                    break;
                }
                this.payload.complete();
                const payment = await ticketDb.addPaymentAsync(this.payload);
                await botApi.sendTextMessageAsync(this.user.telegram_id, i18n.__('ticket.completed', this.payload));
                i18n.setLocale('en');
                if(Array.isArray(photos))
                    await this.informAdminAsync('photo', payment.payment_id);
                else
                    await this.informAdminAsync('document', payment.payment_id);
                break;
            default:
                await botApi.sendTextMessageAsync(this.user.telegram_id, i18n.__('ticket.invalid_message'));
                break;
        }
    }

    async handleAdminGroupMessageAsync(){
        this.payload.complete();
    }
}