'use strict';
import React, {Component} from 'react';
import AppNavigator from "./src/navigation/StackNavigator";
import {createAppContainer, NavigationActions} from "react-navigation";
// import {XFetch, XFetchConfig} from "./XFetch";
import {XFetch, XFetchConfig} from "react-native-xfetch";

global.isLogin = false;
global.tokenTime = 0;

const AppContainer = createAppContainer(AppNavigator);

export default class App extends Component {

  constructor(props) {
    super(props);

    //set all request heads
    const commonHeader = {
      'Content-Type': 'application/json',
      'platform': 'android',
      'deviceId': '6f580xxxxxx-e7aaaaaaaa0'
    };

    XFetchConfig.getInstance()
      .setBaseUrl('http://xxx.xxx.xxx.xxx:8000/') //TODO  input computer's IP address
      .setCommonHeaders(commonHeader)
      .setCommonTimeOut(30000)
      //here, you can monitor the response results of all requests.
      .setResponseConfig(this.handleResponse)
      //param 1: isTokenExpired? , param 2: refreshToken http , param 3: refreshToken response
      .setRefreshTokenConfig(this.checkTokenExpired, this.refreshToken, (promise) => {
        promise.then((res) => {
          //update commonHeaders 'Authorization' value
          XFetchConfig.getInstance()
            .setCommonHeaders({
              'Authorization': res.data.token
            });

          tokenTime = res.data.token;

          console.log('refresh token success')
        }).catch((error) => {
          console.log('refresh token fail');
          isLogin = false;
          //do something...
          //for example, re login.
          this._toLogin();
        })
      })
  }

  handleResponse = (isResponseSuccess, response, resolve, reject, data) =>{
    if (isResponseSuccess) {
      if (!data.success) {// success is your server's custom fields
        throw new Error(JSON.stringify(data))
      } else {
        resolve(data);
        console.log('XFetch_success-->', response.url, data);
      }
    }else {
      reject(data);
      console.log('XFetch_error-->', response.url, data);
      //do something...
      //for example, Toast.
    }
  };

  checkTokenExpired() {
    return isLogin && parseInt(tokenTime) + 30000 <= new Date().getTime();
  }

  refreshToken = () => {
    return new XFetch().post('refresh_token') //Do not use the do() method here.
  };

  _toLogin = () => {
    this.navigator &&
    this.navigator.dispatch(
      NavigationActions.navigate({ routeName: 'Login' })
    );
  };

  render() {
    return (
        <AppContainer
          ref={nav => {
            this.navigator = nav;
          }}
        />
    );
  }
}

