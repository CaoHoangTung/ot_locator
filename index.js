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
            console.log(response);
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

app.get('/storefront/settings', (req,res ) => {
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
        state = params.state,
        timestamp = params.timestamp;

    let queryString = '';
    for (param in params) {
        if (param !== 'hmac')
            queryString += `${param}=${params[param]}&`;
    }
    queryString = queryString.substr(0, queryString.length - 1);

    // if request is valid
    if (FUNC.verifynonce(state) && FUNC.verifyhmac(queryString, hmac) && FUNC.verifyhostname(shop)) {
        console.log("Verification ok");
        // check if the request is instalation (init) or normal request
        let checkInstallation = await db.checkUserExist(shop);

        // post to get accessToken from code
        axios.post(`https://${shop}/admin/oauth/access_token`, {
                client_id: process.env.SHOPIFY_API_KEY,
                client_secret: process.env.SHOPIFY_API_SECRET_KEY,
                code: code,
            })
            .then(async (response) => {
                accessToken = response.data.access_token;
                console.log(accessToken);

                // if user doesn't exist in the db
                if (!checkInstallation.exist) {

                    let registerAt = FUNC.timeStampToDateTime(timestamp);
                    let userJson = {
                        shop: shop,
                        accessToken: accessToken,
                        registerAt: registerAt,
                        active: 0, // active will be set to 1 after user process payment
                    }
                    db.registerUser(userJson);
                    console.log("User registered! ", userJson);

                    // add webhooks
                    FUNC.initWebHooks(accessToken);
                    console.log(`webhooks added for ${shop}`);

                    // add script tags
                    FUNC.initScriptTags(accessToken);
                    console.log(`script tags added for ${shop}`);

                    // verify payment process
                    // make a graphql request to shopify



                    // redirect back to shop's apps panel
                    res.redirect(`https://${shop}/admin/apps`)
                } else { // if user has the app in his/her store

                    // returning the app interface
                    res.redirect(`/?shop=${shop}&token=${accessToken}`)
                }
            })
            .catch((err) => {
                console.log("ERR", err);
                res.status(200).send("Invalid token or shop");
            });

        return;


    } else {
        res.status(403).send("Verification error");
    }
});

app.post('/auth/verifyBilling',(req,res) => {
    console.log(req.body);
});

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