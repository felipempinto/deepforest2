import { LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT } from '../types';

const initialState = {
  access: localStorage.getItem("access_token"),
  refresh: localStorage.getItem("refresh_token"),
  isAuthenticated: false, // Add this property
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {
        ...state,
        access: action.payload.access,
        refresh: action.payload.refresh,
        isAuthenticated: true, // Set isAuthenticated to true when the user logs in
      };
    case LOGIN_FAILURE:
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return {
        ...state,
        access: null,
        refresh: null,
        isAuthenticated: false, // Set isAuthenticated to false when the user fails to log in
      };
    case LOGOUT:
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return {
        ...state,
        access: null,
        refresh: null,
        isAuthenticated: false, // Set isAuthenticated to false when the user logs out
      };
    default:
      return state;
  }
};

export default authReducer;