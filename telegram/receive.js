const
    i18n = require('../i18n.config');
const
    User = require('../types/user'),
    Progress = require('../types/progress');
const
    userDb = require('../database/user');
const
    Ticket = require('../workflows/ticket'),
    Language = require('../workflows/language'),
    CheckTicket = require('../workflows/checkTicket');
const
    help = require('./help');

const WorkFlows = [Ticket, Language, CheckTicket];
const inprogress = {};

module.exports = {
    /**
     * 
     * @param from - from object from telegram bot update
     * @returns {Progress} - Progress object
     */
    async getUserAndPayloadAsync(from, chat_id = null){
        if(chat_id){
            if(chat_id in inprogress)
                return inprogress[chat_id];
            else{
                let user = await userDb.getUserByIdAsync(from.id);
                const fromUser = new User(from);
                if(!user)
                    user = await userDb.addUserAsync(fromUser);
                else if(user.telegram_name!=fromUser.telegram_name || user.telegram_user_name!=fromUser.telegram_user_name)
                    user = await userDb.updateUserAsync({
                        telegram_user_id: user.telegram_user_id,
                        telegram_name: fromUser.telegram_name,
                        telegram_user_name: fromUser.telegram_user_name
                    });
                return new Progress(user);
            }
        }
        else if(from.id in inprogress)
            return inprogress[from.id];
        else{
            let user = await userDb.getUserByIdAsync(from.id);
            const fromUser = new User(from);
            if(!user)
                user = await userDb.addUserAsync(fromUser);
            else if(user.telegram_name!=fromUser.telegram_name || user.telegram_user_name!=fromUser.telegram_user_name)
                user = await userDb.updateUserAsync({
                    telegram_user_id: user.telegram_user_id,
                    telegram_name: fromUser.telegram_name,
                    telegram_user_name: fromUser.telegram_user_name
                });
            return new Progress(user);
        }
    },

    async handleCallbackQueryAsync(webhookEvent){
        const from = webhookEvent.callback_query.from
        if(from.is_bot) return;
        const chat_id = webhookEvent.callback_query.message.chat.id;
        const data = webhookEvent.callback_query.data;

        console.log(JSON.stringify({
            chat_id: webhookEvent.callback_query.message.chat.id,
            message_id: webhookEvent.callback_query.message.message_id,
            data: webhookEvent.callback_query.data
        }));
        // set user and locale
        let { user, payload } = await this.getUserAndPayloadAsync(from);

        try{
            i18n.setLocale(user.language);
            let isFound = false;
            for(let i =0; i < WorkFlows.length; i++){
                const Workflow = WorkFlows[i];
                if(data.startsWith(Workflow.type)){
                    isFound = true;
                    const workflow = new Workflow(user, webhookEvent, payload);
                    await workflow.handleCallbackQueryAsync(data);
                    if(!payload){
                        payload = workflow.payload;
                        inprogress[chat_id] = new Progress(user, payload);
                    }
                    if(payload.isCompleted){
                        delete inprogress[chat_id];
                    }
                    break;
                }
            }
            if(!isFound){
                delete inprogress[chat_id];
                help.sendUnexpectedError(user.telegram_id, 'receive.handleCallbackQueryAsync');
                await help.sendHelpAsync(user);
            }
        }
        catch(ex){
            console.error(ex);
            await help.sendServerErrorAsync(user.telegram_id, 'receive.handleCallbackQueryAsync', payload);
            await help.sendHelpAsync(user);
        }
    },

    async handleNewPrivateMessageAsync(webhookEvent) {
        const from = webhookEvent.message.from;
        if(from.is_bot) return;
        const chat_id = webhookEvent.message.chat.id;
        const text = webhookEvent.message.text;
        
        console.log(JSON.stringify({
            chat_id: webhookEvent.message.chat.id,
            message_id: webhookEvent.message.message_id,
            text: webhookEvent.message.text
        }));

        // set user and locale
        const { user, payload } = await this.getUserAndPayloadAsync(from);

        try{
            i18n.setLocale(user.language);
            if(text){
                const lowerText = text.toLowerCase();
                if(lowerText.startsWith('/start')){
                    delete inprogress[chat_id];
                    await help.sendWelcomeAsync(user);
                    await help.sendHelpAsync(user);
                    return;
                }

                for(let i=0; i<WorkFlows.length; i++){
                    const Workflow = WorkFlows[i];
                    if(lowerText.startsWith(`/${Workflow.type.toLowerCase()}`)){
                        delete inprogress[chat_id];
                        const workflow = new Workflow(user, webhookEvent);
                        await workflow.handleNewPrivateMessageAsync();
                        if(workflow.payload.isCompleted)
                            delete inprogress[chat_id];
                        else
                            inprogress[chat_id] = new Progress(user, workflow.payload);
                        return;
                    }
                }
            }

            if(chat_id in inprogress){
                let isFound = false;
                for(let i=0; i<WorkFlows.length; i++){
                    const Workflow = WorkFlows[i];
                    if(payload.type == Workflow.type){
                        isFound = true;
                        const workflow = new Workflow(user, webhookEvent, payload);
                        await workflow.handleNewPrivateMessageAsync();
                        if(payload.isCompleted)
                            delete inprogress[chat_id];
                        break;
                    }
                }
                if(!isFound){
                    delete inprogress[chat_id];
                    help.sendUnexpectedError(user.telegram_id, 'receive.handleNewPrivateMessageAsync');
                    await help.sendHelpAsync(user);
                }
            }
            else{
                await help.sendAnyFallbackAsync(user.telegram_id);
                await help.sendHelpAsync(user);
            }
        }
        catch (ex){
            console.error(ex);
            await help.sendServerErrorAsync(user.telegram_id, 'receive.handleNewPrivateMessageAsync', payload);
            await help.sendHelpAsync(user);
        }
    },

    async handleAdminGroupMessageAsync(webhookEvent){
        const from = webhookEvent.message.from;
        if(from.is_bot) return;
        const chat_id = webhookEvent.message.chat.id;
        const text = webhookEvent.message.text;
        
        // set user and locale
        const { user, payload } = await this.getUserAndPayloadAsync(from, chat_id);

        try{
            i18n.setLocale(user.language);
            if(text){
                const lowerText = text.toLowerCase();

                for(let i=0; i<WorkFlows.length; i++){
                    const Workflow = WorkFlows[i];
                    if(lowerText.startsWith(`/${Workflow.type.toLowerCase()}`)){
                        delete inprogress[chat_id];
                        const workflow = new Workflow(user, webhookEvent);
                        await workflow.handleAdminGroupMessageAsync();
                        if(workflow.payload.isCompleted)
                            delete inprogress[chat_id];
                        else
                            inprogress[chat_id] = new Progress(user, workflow.payload);
                        return;
                    }
                }
            }

            if(chat_id in inprogress){
                let isFound = false;
                for(let i=0; i<WorkFlows.length; i++){
                    const Workflow = WorkFlows[i];
                    if(payload.type == Workflow.type){
                        isFound = true;
                        const workflow = new Workflow(user, webhookEvent, payload);
                        await workflow.handleAdminGroupMessageAsync();
                        if(payload.isCompleted)
                            delete inprogress[chat_id];
                        break;
                    }
                }
                if(!isFound){
                    delete inprogress[chat_id];
                    help.sendUnexpectedError(user.telegram_id, 'receive.handleAdminGroupMessageAsync');
                    await help.sendHelpAsync(user);
                }
            }
        }
        catch (ex){
            console.error(ex);
            await help.sendServerErrorAsync(user.telegram_id, 'receive.handleAdminGroupMessageAsync', payload);
            await help.sendHelpAsync(user);
        }
    },
}