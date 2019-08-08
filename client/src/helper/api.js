// working with server api

exports._helper_api_makeParams = (queryString,currentLocation) => {
    queryString = queryString.substr(1);
    let splittedParams = queryString.split('&');

    let paramsObj = {};
    for (let index in splittedParams) {
        let param = splittedParams[index].split('=');
        paramsObj[param[0]] = param[1]
    }

    paramsObj['location'] = currentLocation
    return paramsObj
}
