export const UPDATE_GOOGLE_API_KEY = 'UPDATE_GOOGLE_API_KEY';
export const VIEW_GOOGLE_API_KEY = "VIEW_GOOGLE_API_KEY";
export const UPDATE_QUERY_STRING = "UPDATE_QUERY_STRING";
export const UPDATE_CURRENT_LOCATION = "UPDATE_CURRENT_LOCATION";

export function updateGoogleAPIKey(apiKey){
    return {
        type: UPDATE_GOOGLE_API_KEY, apiKey
    }
}

export function viewGoogleAPIKey(){
    return {
        type: VIEW_GOOGLE_API_KEY
    }
}

export function updateQueryString(queryString){
    return {
        type: UPDATE_QUERY_STRING, queryString
    }
}

export function updateCurrentLocation(location){
    return {
        type: UPDATE_CURRENT_LOCATION, location
    }
}