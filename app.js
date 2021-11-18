const
	express = require('express'),
	{ urlencoded, json } = require("body-parser")
	app = express(),
	PORT = process.env.PORT || 5000;
const Joi = require('joi');
const
	config = require('./config'),
	secConfig = require('./security/config'),
	telConfig = require('./telegram/config'),
	wkfConfig = require('./workflows/config');
const
	Authorization = require('./types/authorization');
const
	userDb = require('./database/user'),
	ticketDb = require('./database/ticket'),
	authDb = require('./database/auth'),
	logDb = require('./database/log'),
	{ initializeDatabaseAsync } = require('./database/helper');
const
	botApi = require('./telegram/botApi'),
	telegramReceive = require('./telegram/receive');
  

// Parse application/x-www-form-urlencoded
app.use(
  urlencoded({
    extended: true
  })
);


// Parse application/json.
app.use(json());


// Check all config and show warning
(function checkConfigs(){
	config.checkEnvVariables();
	secConfig.checkEnvVariables();
	telConfig.checkEnvVariables();
	wkfConfig.checkEnvVariables();
})();

// Initialize Database
(async function initializeAsync(){
	await initializeDatabaseAsync();
})();


(async function initializeTelegramCommands(){
	await botApi.callMethodAsync('setMyCommands',{
		commands: [{
			command: "chk",
			description: "Check Ticket"
		}],
		scope: {
			type: "all_group_chats"
		}
	});
	await botApi.callMethodAsync('setMyCommands',{
		commands: [{
            command: "ticket",
            description: "Buy Live Show Ticket"
        },
        {
            command: "language",
            description: "Change Language"
        }],
		scope: {
			type: "all_private_chats"
		}
	});
})();


/**
 * 
 * @param {string} authorization 
 * @param {string} resource 
 * @returns 
 */
async function AuthenticateAsync(authorization, resource){
	if(!authorization) return false;
	
	const authArray = `${authorization}`.split(' ');
	if(authArray.length != 2) return false;
	if(authArray[0].toLowerCase() != 'bearer') return false;
	
	const token = authArray[1];
	const auth = await authDb.getAuthorizationByTokenAsync(token);
	if(!auth) return false;
	
	const isAuthorize = auth[resource];
	const status = (isAuthorize) ? true : false;
	await logDb.addLogAsync(auth.auth_id, resource, status);
	if(!isAuthorize) return false;
	return true;
}

/**
 * 
 * @param {*} query 
 * @returns 
 */
function validateGetLimit(query){
	const schema = Joi.object().keys({
		limit: Joi.number().integer().min(1).max(100),
		page: Joi.number().integer().min(1)
	}).unknown(true);
	return schema.validate(query);
}

/**
 * 
 * @param {Authorization} auth 
 * @returns 
 */
function validateAuthorization(auth){
	const schema = Joi.object().keys({
		token: Joi.string().min(10).max(20),
		name: Joi.string().max(50),
		query_users: Joi.boolean(),
		query_payments: Joi.boolean(),
		query_tickets: Joi.boolean(),
		generate_tickets: Joi.boolean(),
		query_auth: Joi.boolean(),
		add_auth: Joi.boolean(),
		update_auth: Joi.boolean(),
		query_log: Joi.boolean(),
	}).unknown(true);
	return schema.validate(auth);
}

// Get Authorization Information
app.get(config.authorizationUrl, async (req, res) => {
	if(!(await AuthenticateAsync(req.headers.authorization, 'query_auth')))
		return res.status(403).send('You are not authorize to query authorization data.');

	let { error } = validateGetLimit(req.query);
	if(error) return res.status(400).send(error.details[0].message);

	let { limit, page } = req.query;
	if(!limit) limit = 20;
	if(!page) page = 1;
	const auths = await authDb.getAuthorizationsAsync(limit, page);
	res.status(200).send(auths);
});

// Get Authorization by auth_id
app.get(`${config.authorizationUrl}/:auth_id`, async (req, res) => {
	if(!(await AuthenticateAsync(req.headers.authorization, 'query_auth')))
		return res.status(403).send('You are not authorize to query authorization data.');
	
	const auth_id = req.params.auth_id;
	const auth = await authDb.getAuthorizationByIdAsync(auth_id);
	if(!auth)
		return res.status(404).send(`The Authorization with given auth_id=${auth_id} was not found.`);
	res.status(200).send(auth);
});

// Add new Authorization
app.post(config.authorizationUrl, async (req, res) => {
	if(!(await AuthenticateAsync(req.headers.authorization, 'add_auth')))
		return res.status(403).send('You are not authorize to add authorization data.');

	let { error } = validateAuthorization(req.body);
	if(error) return res.status(400).send(error.details[0].message);

	const schema = Joi.object().keys({
		token: Joi.required(),
		name: Joi.required()
	}).unknown(true);
	error = schema.validate(req.body).error;
	if(error) return res.status(400).send(error.details[0].message);

	const auth = await authDb.addAuthorizationAsync(req.body);
	res.status(201).send(auth);
});

// Update Authorization
app.put(`${config.authorizationUrl}/:auth_id`, async (req, res) => {
	if(!(await AuthenticateAsync(req.headers.authorization, 'update_auth')))
		return res.status(403).send('You are not authorize to update authorization data.');

	const auth_id = req.params.auth_id;
	let auth = await authDb.getAuthorizationByIdAsync(auth_id);
	if(!auth)
		return res.status(404).send(`The Authorization with given auth_id=${auth_id} was not found.`);

	const { error } = validateAuthorization(req.body);
	if(error) return res.status(400).send(error.details[0].message);

	auth = await authDb.updateAuthorizationAsync(auth_id, req.body);
	res.status(200).send(auth);
});

// Delete Authorization
app.delete(`${config.authorizationUrl}/:auth_id`, async(req, res) => {
	if(!(await AuthenticateAsync(req.headers.authorization, 'query_auth')))
		return res.status(403).send('You are not authorize to query authorization data.');

	const auth_id = req.params.auth_id;
	const auth = await authDb.deleteAuthorizationAsync(auth_id);
	if(!auth)
		return res.status(404).send(`The Authorization with given auth_id=${auth_id} was not found.`);
	res.status(200).send(auth);
});


// Get Log Information
app.get(config.logUrl, async (req, res) => {
	if(!(await AuthenticateAsync(req.headers.authorization, 'query_log')))
		return res.status(403).send('You are not authorize to query log data.');

	let { error } = validateGetLimit(req.query);
	if(error) return res.status(400).send(error.details[0].message);
	
	const schema = Joi.object().keys({
		auth_id: Joi.number().integer()
	}).unknown(true);
	error = schema.validate(req.query).error;
	if(error) return res.status(400).send(error.details[0].message);

	let { limit, page } = req.query;
	if(!limit) limit = 20;
	if(!page) page = 1;
	const auth_id = req.query.auth_id;
	const logs = await logDb.getLogsAsync(limit, page, auth_id);
	res.status(200).send(logs);
});


// Get User Information
app.get(config.userUrl, async (req, res) => {
	if(!(await AuthenticateAsync(req.headers.authorization, 'query_users')))
		return res.status(403).send('You are not authorize to query user data.');
		
	let { error } = validateGetLimit(req.query);
	if(error) return res.status(400).send(error.details[0].message);

	let { limit, page } = req.query;
	if(!limit) limit = 20;
	if(!page) page = 1;
	const users = await userDb.getUsersAsync(limit, page);
	res.status(200).send(users);
});


// Get Payment Information
app.get(config.paymentUrl, async (req, res) => {
	if(!(await AuthenticateAsync(req.headers.authorization, 'query_payments')))
		return res.status(403).send('You are not authorize to query payments data.');
	
	const { error } = validateGetLimit(req.query);
	if(error) return res.status(400).send(error.details[0].message);

	let { limit, page } = req.query;
	if(!limit) limit = 20;
	if(!page) page = 1;
	const payments = await ticketDb.getPaymentsAsync(limit, page);
	res.status(200).send(payments);
});


// Get Ticket Information
app.get(config.ticketUrl, async (req, res) => {
	if(!(await AuthenticateAsync(req.headers.authorization, 'query_tickets')))
		return res.status(403).send('You are not authorize to query tickets data.');

	const { error } = validateGetLimit(req.query);
	if(error) return res.status(400).send(error.details[0].message);

	let { limit, page } = req.query;
	if(!limit) limit = 20;
	if(!page) page = 1;
	const tickets = await ticketDb.getTicketsAsync(limit, page);
	res.status(200).send(tickets);
});

// Create new Tickets
app.post(config.ticketUrl, async (req, res) => {
	if(!(await AuthenticateAsync(req.headers.authorization, 'generate_tickets')))
		return res.status(403).send('You are not authorize to generate tickets.');

	const schema = Joi.object().keys({
		count: Joi.number().integer().min(1).max(20).required()
	});
	const { error } = schema.validate(req.body);
	if(error) return res.status(400).send(error.details[0].message);

	const count = req.body.count;
	const tickets = await ticketDb.addTicketsAsync(count);
	res.status(201).send(tickets);
});


// Endpoint for telegram bot
app.post(config.telegramUrl, async (req, res) => {
	const body = req.body;
  
	// // For Debugging only. Please disable for Production
	// console.log('Received Telegram Webhook:');
	// console.dir(body, {depth: null});
  
	res.status(200).send('EVENT_RECEIVED');
  
	if(body.message){
	  	const message = body.message;
	  	if(message.chat){
			const chat = message.chat;
			if(chat.type == 'private')
				await telegramReceive.handleNewPrivateMessageAsync(body);
			else if(chat.id == telConfig.adminChatID)
				await telegramReceive.handleAdminGroupMessageAsync(body);
	  	}
	}
	else if(body.callback_query)
		await telegramReceive.handleCallbackQueryAsync(body);
});


// Listen for requests :)
var listener = app.listen(PORT, function(){
	console.log(`The app is listening on port ${listener.address().port}`);
});