/**
 * Configuration for workflows
 * Written By:    Nathan Chen
 * Last Updated:  2021-11-16
 */

 const ENV_VARS = [
    'LINK_GROUP',
    'LINK_MESSENGER',
    'INFO_PAYLAH',
    'INFO_PAYNOW',
    'INFO_PAYPAL',
    'COST_SGD',
    'COST_USD',
    'COST_MMK',
    'MAX_COUNT'
];

module.exports = {
    // Link for Private Group
    link_group: process.env.LINK_GROUP,

    // Link for Messenger for user to contact
    link_messenger: process.env.LINK_MESSENGER,

    // PayLah Information
    info_paylah: process.env.INFO_PAYLAH,

    // PayNow Information
    info_paynow: process.env.INFO_PAYNOW,

    // PayPal Information
    info_paypal: process.env.INFO_PAYPAL,

    // SGD Ticket Price
    cost_sgd: parseInt(process.env.COST_SGD),

    // USD Ticket Price
    cost_usd: parseInt(process.env.COST_USD),

    // MMK Ticket Price
    cost_mmk: parseInt(process.env.COST_MMK),

    // Maxium Ticket Count
    max_count: parseInt(process.env.MAX_COUNT),

    checkEnvVariables: function(){
        ENV_VARS.forEach(function(key){
            if(!process.env[key]){
                console.warn(`WARNING: Missing the environment variable ${key}`);
            }
        })
    }
}