const mysqlx = require('@mysql/xdevapi');

let options = {
    host: process.env.HOST,
    port: 33060,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    schema: process.env.DB_SCHEMA,
};

let conn = mysqlx.getSession(options);
conn.then((session) => {
    appdb = session.getSchema(options.schema)
    exports.test = () => {
        return appdb
            .createCollection('test')
            .catch((err) => {
                console.log(err);
                return 0;
            })
    }

    exports.getAllLocations = (json) => {
        let shop = json.shop;
        let arr = [];

        return appdb
            .getTable('locations')
            .select(['idlocations', 'shop', 'address', 'city', 'area', 'state', 'lat', 'lng'])
            .where('shop = :shop')
            .bind('shop', shop)
            .execute((row) => {
                let newRow = {
                    idlocations: row[0],
                    shop: row[1],
                    address: row[2],
                    city: row[3],
                    area: row[4],
                    state: row[5],
                    lat: row[6],
                    lng: row[7],
                }
                arr.push(newRow);
            })
            .then((_) => {
                return {
                    status: 1,
                    locations: arr,
                }
            })
            .catch((err) => {
                if (err) {
                    console.log(`DB: error fetching locations for shop ${shop}`);
                    console.log(err);
                    return {
                        status: 0
                    }
                }
            })
    }

    exports.addLocation = (json) => {
        // add Location to db

        let shop = json.shop,
            address = json.location.address,
            city = json.location.city,
            area = json.location.area,
            state = json.location.state,
            lat = json.location.lat,
            lng = json.location.lng;

        console.log(`Adding location for shop '${shop}'`);

        return appdb
            .getTable('locations')
            .insert(['shop', 'address', 'city', 'area', 'state', 'lat', 'lng'])
            .values([shop, address, city, area, state, lat, lng])
            .execute()
            .then(() => {
                return {
                    status: 1
                };
            })
            .catch((err) => {
                console.log(`DB: error adding locations for shop ${shop}`);
                console.log(err);
                return {
                    status: 0
                }
            })
    }

    exports.modifyLocation = (json) => {
        let idlocations = json.location.idlocations,
            shop = json.shop,
            address = json.location.address,
            city = json.location.city,
            area = json.location.area,
            state = json.location.state,
            lat = json.location.lat,
            lng = json.location.lng;

        return appdb
            .getTable('locations')
            .update()
            .set('address', address)
            .set('city', city)
            .set('area', area)
            .set('state', state)
            .set('lat', lat)
            .set('lng', lng)
            .where('idlocations=:id')
            .bind('id', idlocations)
            .execute()
            .then(_ => {
                return {
                    status: 1
                };
            })
            .catch(err => {
                console.log(`DB: error updating location ${idlocations} for shop ${shop}`)
                console.log(err);
                return {
                    status: 0
                }
            })
    }

    exports.deleteLocation = (json) => {
        let idlocations = json.location.idlocations,
            shop = json.shop;

        return appdb
            .getTable('locations')
            .delete()
            .where("shop = :shop AND idlocations = :idlocations")
            .bind('shop', shop)
            .bind('idlocations', idlocations)
            .execute()
            .then(_ => {
                return {
                    status: 1
                }
            })
            .catch(err => {
                console.log(`error deleting location ${idlocations} for shop ${shop}`)
                console.log(err);
                return {
                    status: 0
                }
            })
    }

    // get wrapperClass, sectionHeader and googleAPIKey
    exports.getStorefrontSettings = async (json) => {
        let shop = json.shop,
            settings = {};

        let getSettings = await appdb
            .getTable('settings')
            .select(['shop', 'store_front_settings','backend_settings'])
            .where('shop = :shop')
            .bind('shop', shop)
            .execute((row) => {
                let newRow = {
                    store_front_settings: row[1],
                    backend_settings: row[2],
                }
                settings = newRow;
            })
            .then((response) => {
                return settings;
            })
            .catch((err) => {
                if (err) {
                    console.log(`DB: error getting storefront settings for shop ${shop}`);
                    console.log(err);
                    settings = null;
                    return 0;
                }
            })

        if (settings === null)
            return {
                status: 0
            }
        else {
            return {
                status: 1,
                wrapperClass: settings['store_front_settings']['wrapperClass'],
                sectionHeader: settings['store_front_settings']['sectionHeader'],
                googleAPIKey: settings['backend_settings']['googleAPIKey'],
            }
        }
    }

    exports.getGoogleAPIKey = async (json) => {
        let shop = json.shop,
            settings = {};

        let getSettings = await appdb
            .getTable('settings')
            .select(['shop', 'backend_settings'])
            .where('shop = :shop')
            .bind('shop', shop)
            .execute((row) => {
                let newRow = {
                    backend_settings: row[1],
                }
                settings = newRow;
            })
            .then((response) => {
                return settings;
            })
            .catch((err) => {
                if (err) {
                    console.log(`DB: error getting backend settings for shop ${shop}`);
                    console.log(err);
                    settings = null;
                    return 0;
                }
            })

        if (settings === null)
            return {
                status: 0
            }
        else {
            return {
                status: 1,
                googleAPIKey: settings['backend_settings']['googleAPIKey'],
            }
        }
    }

    exports.changeSettings = async (json) => {
        let shop = json.shop,
            settings = {},
            updatedSettings = json.settings;

        let getSettings = await appdb
            .getTable('settings')
            .select(['shop', 'store_front_settings', 'backend_settings'])
            .where('shop = :shop')
            .bind('shop', shop)
            .execute((row) => {
                let newRow = {
                    store_front_settings: row[1],
                    backend_settings: row[2],
                }
                settings = newRow;
            })
            .then((response) => {
                return settings;
            })
            .catch((err) => {
                if (err) {
                    console.log(`DB: error getting settings for update process for shop ${shop}`);
                    console.log(err);
                    settings = null;
                    return 0;
                }
            })

        if (settings === null)
            return {
                status: 0
            };

        // change store_front_settings
        for (let index in settings['store_front_settings']) {
            settings['store_front_settings'][index] = updatedSettings[index];
        }

        // change backend_settings
        for (let index in settings['backend_settings']) {
            settings['backend_settings'][index] = updatedSettings[index];
        }

        return appdb
            .getTable('settings')
            .update()
            .set('store_front_settings', settings['store_front_settings'])
            .set('backend_settings', settings['backend_settings'])
            .where('shop = :shop')
            .bind('shop', shop)
            .execute()
            .then(_ => {
                return {
                    status: 1
                };
            })
            .catch(err => {
                console.log(`DB: error updating settings for shop ${shop}`)
                console.log(err);
                return {
                    status: 0
                }
            })
    }

    exports.checkUserExist = async (shopURL) => {
        let exist = 0,
            active = 0;
        let sqlCommand = `SELECT active FROM users WHERE shop = "${shopURL}"`;

        return await session
            .sql(sqlCommand)
            .execute(result => {
                exist = result.length > 0;
                active = result[0] === 1; // result[0] is the 'active' value
            })
            .then((_) => {
                return {
                    exist: exist,
                    active: active
                };
            })
            .catch((err) => {
                if (err) throw err;
                return {
                    exist: exist,
                    active: active
                };
            });

    }

    // add user to db
    exports.registerUser = (json) => {
        let store_front_json = {
            sectionHeader: 'Our stores',
            wrapperClass: '.main-content',
        }

        let backend_json = {
            googleAPIKey: '',
        }

        let shop = json.shop,
            accessToken = json.accessToken,
            registerAt = json.registerAt;
        return appdb
            .getTable('users')
            .insert(['shop', 'accessToken', 'registerAt'])
            .values([shop, accessToken, registerAt])
            .execute()
            .then((_) => {
                return appdb
                    .getTable('settings')
                    .insert(['shop', 'store_front_settings', 'backend_settings'])
                    .values([shop, store_front_json, backend_json])
                    .execute()
                    .then((_) => {
                        return 1;
                    })
                    .catch((err) => {
                        if (err) throw (err);
                    });
            })
            .catch((err) => {
                if (err) throw (err);
            });
    }

    exports.verifyUser = async (shop, token) => {
        let verification = 0;
        let sqlComand = `SELECT idusers from users WHERE shop="${shop}" AND accessToken="${token}"`;
        return await session
            .sql(sqlComand)
            .execute(result => {
                verification = (result.length === 1)
            })
            .then(_ => {
                return {
                    status: verification
                }
            })
            .catch(err => {
                console.log(`DB: Error verifying shop ${shop}`);
                console.log(err);
                return {
                    status: 0
                }
            })
    }

    // delete user from db, delete all locations related to that user
    exports.deleteUser = async (json) => {
        let shop = json.shop;

        return appdb
            .getTable('users')
            .delete()
            .where("shop = :shop")
            .bind('shop', shop)
            .execute()
            .then(_ => {
                return appdb
                    .getTable('locations')
                    .delete()
                    .where("shop = :shop")
                    .bind("shop", shop)
                    .execute()
                    .then(_ => {
                        return appdb
                            .getTable('settings')
                            .delete()
                            .where("shop = :shop")
                            .bind("shop", shop)
                            .execute();
                    })
            })
            .catch((err) => {
                if (err) {
                    throw (err);
                }
            });
    }
})