import { combineReducers } from 'redux'
import { UPDATE_GOOGLE_API_KEY, UPDATE_QUERY_STRING, UPDATE_CURRENT_LOCATION } from './actions';

const initialState = {
    googleAPIKey: ''
}

function GoogleAction(state = {}, action){
    if (typeof state === 'undefined'){
        return initialState;
    }
    switch (action.type) {
        case UPDATE_GOOGLE_API_KEY:
            return Object.assign({}, state, {
                googleAPIKey: action.apiKey
            })
        default:
            return state
    }
}

const initialAppState = {
    queryString: '',
    currentLocation: {},
}

function AppAction(state = {}, action){
    if (typeof state === 'undefined'){
        return initialAppState;
    }
    switch (action.type) {
        case UPDATE_QUERY_STRING:
            return Object.assign({}, state, {
                queryString: action.queryString
            })
        case UPDATE_CURRENT_LOCATION:
            return Object.assign({}, state, {
                currentLocation: action.location
            })
        default:
            return state
    }
}


const globalApp = combineReducers({
    GoogleAction,
    AppAction
})

export default globalApp