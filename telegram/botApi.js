/**
 * Most used telegram Bot Api function
 * Written By:    Nathan Chen
 * Last Updated:  2021-11-16
 */

const
    config = require('./config'),
    fetch = require('node-fetch'),
    { URL } = require('url');
const MARKDOWNV2_SPECIAL_CHARACTERS = [ '_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!' ];

module.exports = {
    /**
     * 
     * call telegram bot api method
     * @param {string} path - method name
     * @param body - body of the method
     * @returns - return result
     * 
     */
    async callMethodAsync(path, body = null){
        const urlStr = `${config.apiUrl}/${path}`;
        const url = new URL(urlStr);
        let json;
        if(body)
            json = JSON.stringify(body);
        else
            json = null;
        let response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: json
        });
        if(response.ok)
            return (await response.json()).result;
        else{
            console.error({
                status: response.status,
                statusText: response.statusText,
                path: path,
                body: json,
                error: (await response.json()).description
            });
            return null;
        }
    },

    /**
     * 
     * Get Basic Information about bot
     * @returns Returns basic information about the bot in form of a User object
     * 
     */
    async getMeAsync(){
        return await this.callMethodAsync('getMe');
    },

    /**
     * 
     * send Message to chat_id
     * @param {number} chat_id - chat id to send text message
     * @param {string} text - text message
     * 
     */
    async sendTextMessageAsync(chat_id, text){
        return await this.callMethodAsync('sendMessage', {
            chat_id: chat_id,
            text: text
        });
    },

    /**
     * 
     * send Message to chat_id with MarkdownV2
     * @param {number} chat_id - chat id to send text message
     * @param {*} text - text message
     * 
     */
    async sendMarkdownV2TextMessageAsync(chat_id, text){
        return await this.callMethodAsync('sendMessage', {
            chat_id: chat_id,
            text: text,
            parse_mode: 'MarkdownV2'
        })
    },

    /**
     * 
     * send Photo to chat_id with MarkdownV2
     * @param {number} chat_id - chat id to send text message
     * @param {string} file_id - file id to add as photo
     * @param {string} text - text message
     * 
     */
    async sendMarkdownV2Photo(chat_id, file_id, text){
        return await this.callMethodAsync('sendPhoto',{
            chat_id: chat_id,
            photo: file_id,
            caption: text,
            parse_mode: 'MarkdownV2'
        })
    },

    /**
     * 
     * delete message from chat_id and message_id
     * @param {number} chat_id
     * @param {number} message_id 
     * 
     */
    async deleteMessageAsync(chat_id, message_id){
        return await this.callMethodAsync('deleteMessage', {
            chat_id: chat_id,
            message_id, message_id
        });
    },

    /**
     * 
     * remove reply markup
     * @param callbackEvent - callback event object
     * 
     */
    async removeReplyMarkupAsync(callbackEvent){
        return await this.callMethodAsync('editMessageReplyMarkup', {
            chat_id: callbackEvent.callback_query.message.chat.id,
            message_id: callbackEvent.callback_query.message.message_id,
            reply_markkup: {}
        });
    },

    /**
     * 
     * Remove replymarkup and update the text of the message
     * @param callbackEvent - callback event object
     * @param {string} text - text to be updated
     * 
     */
    async editTextAndRemoveReplyMarkupAsync(callbackEvent, text){
        return await this.callMethodAsync('editMessageText', {
            chat_id: callbackEvent.callback_query.message.chat.id,
            message_id: callbackEvent.callback_query.message.message_id,
            text: text,
            reply_markkup: {}
        });
    },

    /**
     * 
     * Escaped with the preceding character '\' for forbidden characters
     * @param {string} text 
     * @param {Array<string>} exceptions 
     * @returns {string}
     */
    getMarkdownV2Text(text, exceptions = null){
        let toReturn = `${text}`;
        MARKDOWNV2_SPECIAL_CHARACTERS.forEach((c) => {
            if(exceptions && exceptions.includes(c)){}
            else
                toReturn = toReturn.replaceAll(c, `\\${c}`);
        });
        return toReturn;
    }
}