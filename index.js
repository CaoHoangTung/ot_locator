const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.port || 3000;

const CONST = require('./constants');
const FUNC = require('./modules/customFunc');
const db = require('./modules/database');


app.use(express.json());
app.use(express.static('build'));

// verify request with shop and token params
app.use(/^\/api\/.*/, (req, res, next) => {
    let {
        shop,
        token
    } = (req.method === 'GET') ? req.query: req.body;

    db.verifyUser(shop, token)
        .then(response => {
            if (response.status)
                next();
            else
                res.status(403).send("Unauthorized");
        })
        .catch(err => {
            console.log(`SV: error verifying shop ${shop}`)
            return 0;
        })
});

app.use(/^\/storefront\/.*/, (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
})

app.get('/api', (req, res) => {
    console.log(`Hello world ${req.query.s}`);
    res.status(200).send(`Hello world ${req.query.s}`);
});

app.get('/api/getAllSettings', async (req, res) => {
    let obj = await db.getAllSettings({
        shop: req.query.shop
    });

    // provide user with the settings
    let returnJSON = {
        wrapperClass: obj.wrapperClass,
        sectionHeader: obj.sectionHeader,
        googleAPIKey: obj.googleAPIKey,
        googleAPIWhitelistDomains: obj.googleAPIWhitelistDomains,
    }
    res.status(200).send(returnJSON);
})

app.get('/api/getBackendSettings', async (req, res) => {
    let obj = await db.getBackendSettings({
        shop: req.query.shop
    });

    console.log(obj);
    // provide user with the google api key
    let returnJSON = {
        key: obj.googleAPIKey,
        googleAPIWhitelistDomains: obj.googleAPIWhitelistDomains
    }
    res.status(200).send(returnJSON);
})

app.get('/api/locations/get', async (req,res) => {
    
    let json = req.query;
    let {
        shop,
        idlocations
    } = json;
    console.log("GETTING ",json);
    let returnJSON = await db.getLocationByID({
        idlocations: idlocations,
        shop: shop
    });    
    res.status(200).send(returnJSON);
})

app.get('/api/locations/all', async (req, res) => {
    let json = req.query;

    let {
        shop
    } = json;
    let returnJSON = await db.getAllLocations({
        shop: shop
    });

    res.status(200).send(returnJSON);
})

app.post('/api/locations/add', (req, res) => {
    // add location
    let json = req.body;
    console.log(json);
    db.addLocation(json)
        .then(response => {
            res.status(200).send(response);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send(response)
        });
})

app.put('/api/locations/modify', (req, res) => {
    let json = req.body;

    db.modifyLocation(json)
        .then(response => {
            res.status(200).send(response);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send(err)
        })
})

app.delete('/api/locations/delete', (req, res) => {
    let json = req.body;
    console.log(json);
    let {
        shop,
        token
    } = json;
    // will use this to verify user later

    db.deleteLocation(json)
        .then(response => {
            console.log(response);
            res.status(200).send(response);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send(response);
        })
})

app.post('/api/settings/change', (req, res) => {
    let json = req.body;

    db.changeSettings(json)
        .then(response => {
            res.status(200).send(response);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send(err);
        })
})

app.get('/storefront/locations/all', async (req, res) => {
    let json = req.query;

    let {
        shop
    } = json;
    let returnJSON = await db.getAllLocations({
        shop: shop
    });

    res.status(200).send(returnJSON);
})

app.get('/storefront/settings', (req, res) => {
    let json = req.query;

    db.getStorefrontSettings(json)
        .then(response => {
            res.status(200).send(response)
        })
        .catch(err => {
            console.error(err);
            res.status(500).send(err);
        })
})


app.get('/auth', (req, res) => {
    let params = req.query;

    if (params.hmac === undefined || params.shop === undefined || params.timestamp === undefined)
        res.status(403).send("Invalid parameters");

    let hmac = params.hmac; // I have to verify hmac later
    let shop = params.shop;
    let timestamp = params.timestamp;

    let shopifyApiKey = process.env.SHOPIFY_API_KEY;
    let scopes = 'read_content,write_content,read_script_tags,write_script_tags';
    let redirectURI = `${CONST._rootAppURI}/auth/callback`;
    let nonce = `${shop}_${timestamp}_${FUNC.randomStr(4)}`;
    let access_mode = 'offline'; // don't need this, but specified
    let shopifyhook = `https://${shop}/admin/oauth/authorize?client_id=${shopifyApiKey}&scope=${scopes}&redirect_uri=${redirectURI}&state=${nonce}&grant_options[]=${access_mode}`;

    console.log("FIRST HOOK RECEIVED AND PROCESSED. REDIRECTING TO " + shopifyhook);



    // redirect back to shopify to finish installing
    res.redirect(shopifyhook);
});

app.get('/auth/callback', async (req, res) => {
    // the app is now installed at user store
    console.log("Verifying");

    let params = req.query;

    let code = params.code,
        hmac = params.hmac,
        shop = params.shop,
        state = params.state;
        
    let queryString = '';
    for (param in params) {
        if (param !== 'hmac')
            queryString += `${param}=${params[param]}&`;
    }

    // remove the last '&' character
    queryString = queryString.substr(0, queryString.length - 1);

    // if request is valid
    if (FUNC.verifynonce(state) && FUNC.verifyhmac(queryString, hmac) && FUNC.verifyhostname(shop)) {
        console.log("Verification ok");
        // check if the request is instalation (init) or normal request
        let checkInstallation = await db.checkUserExist(shop);

        // get access token
        let requestToGetAccessToken = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: process.env.SHOPIFY_API_KEY,
            client_secret: process.env.SHOPIFY_API_SECRET_KEY,
            code: code,
        })
        let accessToken = requestToGetAccessToken.data.access_token;

        // if user doesn't exist in the db
        if (!checkInstallation.exist) {
            // verify payment process
            // make a graphql request to shopify
            let requestPayment = await FUNC.requestPayment(shop, accessToken);

            let confirmationLink = requestPayment.appSubscriptionCreate !== undefined ? requestPayment.appSubscriptionCreate.confirmationUrl : requestPayment
            if (requestPayment.appSubscriptionCreate !== undefined) {
                console.log(confirmationLink);
                // if the payment request is successful, register the user to db an redirect the user to the confirmation link
                // let registerAt = FUNC.timeStampToDateTime(timestamp);
                // let userJson = {
                //     shop: shop,
                //     accessToken: accessToken,
                //     registerAt: registerAt,
                // }
                // db.registerUser(userJson);
                // console.log("User registered! ", userJson);

                // // add webhooks
                // FUNC.initWebHooks(accessToken);
                // console.log(`webhooks added for ${shop}`);

                // // add script tags
                // FUNC.initScriptTags(accessToken);
                // console.log(`script tags added for ${shop}`);

                // redirect to the confirmatin link
                // res.redirect(confirmationLink);
                res.status(200).send(`
                    <h2>Please click the button below to confirm your payment request!</h2>
                    <a href="${confirmationLink}" target="blank">
                        <button type="button" href="go" class="btn btn-primary btn-lg">Confirm</button>
                    </a>
                    <h2>Or click on this link: </h2>
                    <a href="${confirmationLink}" target="blank">
                        ${confirmationLink}
                    </a>
                    `);
            } else {
                console.log(response);
                res.status(200).send("<h3>Error verifying your subscription. Please try again!</h3> <br> Error code:<br>" + response);
            }

        } else { // if user has the app in his/her store
            // returning the app interface
            if (checkInstallation.active) // if user has process payment
                res.redirect(`/?shop=${shop}&token=${accessToken}`)
            // res.status(200).send("OK");
            else
                res.redirect(`/notpay`)
        }
    } else {
        res.status(403).send("Verification error");
    }
});

// after the charge is confirmed, a request is fired in to this route
app.get('/auth/chargeConfirm', (req, res) => {

    let shop = req.query.shop,
        accessToken = req.query.token;
        
    let registerAt = FUNC.timeStampToDateTime(Date.now()/1000);
    let userJson = {
        shop: shop,
        accessToken: accessToken,
        registerAt: registerAt,
    }
    db.registerUser(userJson);
    console.log("User registered! ", userJson);

    // add webhooks
    FUNC.initWebHooks(accessToken);
    console.log(`webhooks added for ${shop}`);

    // add script tags
    FUNC.initScriptTags(accessToken);
    console.log(`script tags added for ${shop}`);
    res.redirect(`https://${shop}/admin/apps`)
});

// when app is uninstalled, shopify will fire into this route
app.post('/uninstall', (req, res) => {
    console.log(`APP UNINSTALLED BY ${req.body.domain}`);

    db.deleteUser({
        shop: req.body.domain
    });

    res.status(200).send("OK");
})

app.listen(PORT, () => {
    console.log("SERVER UP AND RUNNING ON PORT " + PORT);
})

app.get('/test', async (req, res) => {
    let accessToken = req.query.token;
    let requestPayment = await FUNC.requestPayment(accessToken);

    let response = requestPayment.appSubscriptionCreate !== undefined ? requestPayment.appSubscriptionCreate.confirmationUrl : requestPayment
    if (requestPayment.appSubscriptionCreate !== undefined) {
        // if the payment request is successful, redirect the user to the confirmation link
        res.redirect(response);
    } else {
        console.log(response);
        res.status(200).send("<h3>Error verifying your subscription. Please try again!</h3> <br> Error code:<br>" + response);
    }
});