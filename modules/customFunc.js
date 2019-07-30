const axios = require('axios');
const CONST = require('../constants.js');

const crypto = require('crypto');

exports.randomStr = (length) => {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

exports.verifynonce = (nonce) => {
    // don't verify this for now
    return 1;
}

exports.verifyhmac = (queryString, hmac) => {
    const hash = crypto
                .createHmac('sha256',process.env.SHOPIFY_API_SECRET_KEY)
                .update(queryString)
                .digest('hex');

    return hash === hmac;
}

exports.verifyhostname = (hostname) => {
    const regExp = `[0-9,a-z,A-Z,-]*.myshopify.com$`;
    return hostname.match(regExp) === null ? 0 : 1;
}

// request payment from merchant
exports.requestPayment = async (shop,accessToken) => {
    // import { request, GraphQLClient } from 'graphql-request';
    const {request, GraphQLClient} = require('graphql-request');
    
    // subscriptionQuery contains graphql body
    const subscriptionQuery = `mutation {
        appSubscriptionCreate(
          name: "Subscription Plan"
          returnUrl: "${CONST._rootAppURI}/auth/chargeConfirm?shop=${shop}&token=${accessToken}"
          trialDays: ${CONST._trialDays}
          test: ${CONST._testMode}
          lineItems: [{
            plan: {
              appRecurringPricingDetails: {
                  price: { amount: ${CONST._recurringPrice}, currencyCode: USD }
              }
            }
          }]
        ) {
          userErrors {
            field
            message
          }
          confirmationUrl
          appSubscription {
            id
          }
        }
      }`
      
    // console.log(gql.request(`${CONST._shopAPIURI}/unstable/graphql.json`,subscriptionQuery).then(response=>console.log(response).catch(err=>{throw err})));
    const client = new GraphQLClient(
        `${CONST._shopAPIURI}/unstable/graphql.json`, 
        {   
            headers: {
            "X-Shopify-Access-Token": accessToken
            } 
        }
    );
    
    let result =  
    client
    .request(subscriptionQuery)
    .then(response => {
        return response
    })
    .catch(err => {
        return err;
    })
    
    return result;
}

exports.initWebHooks = (accessToken) => {
    axios.post(`${CONST._shopAPIURI}/${CONST._apiVersion}/webhooks.json`,
        {
            "webhook": {
                "topic": "app/uninstalled",
                "address": `${CONST._rootAppURI}/uninstall`,
                "format": "json"
            }
        },  
        {
            headers: {
                "X-Shopify-Access-Token": accessToken
            }
        }
    ).then((_) => {
        return 1;
    }).catch((err) => {
        if (err) throw (err);
    })
}

exports.initScriptTags = (accessToken) => {
    axios.post(`${CONST._shopAPIURI}/${CONST._apiVersion}/script_tags.json`,
        {
            "script_tag": {
                "event": "onload",
                "src": `${CONST._rootAppURI}/ot_app.js`
            }
        },  
        {
            headers: {
                "X-Shopify-Access-Token": accessToken
            }
        }
    ).then((_) => {
        return 1;
    }).catch((err) => {
        if (err) throw (err.response.data.errors);
    })
}

exports.timeStampToDateTime = (timestamp) => {
    let d = new Date(timestamp*1000);
    let year = d.getFullYear();
    let month = "0"+d.getMonth();
    let day = "0"+d.getDay();
    let hours = "0"+d.getHours();
    let minutes = "0"+d.getMinutes();
    let seconds = "0"+d.getSeconds();
    registerAt = year+"-"+month.substr(-2)+"-"+(day.substr(-2))+" "+(hours.substr(-2))+":"+(minutes.substr(-2))+":"+(seconds.substr(-2));
    return registerAt;
}
