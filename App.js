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

  //set all request heads
  _getCommonHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'platform': 'android',
      'deviceId': '6f580xxxxxx-e7aaaaaaaa0',
      'authorization': tokenTime
    }
  };

  constructor(props) {
    super(props);

    const commonHeaders = {
      'Content-Type': 'application/json',
      'platform': 'android',
      'deviceId': '6f580xxxxxx-e7aaaaaaaa0',
      'appCode': 1,
      'authorization': tokenTime
    };

    XFetchConfig.getInstance()
      .setBaseUrl('http://127.0.0.1:8000/')
      .setCommonHeaders(this._getCommonHeaders)
      .setCommonTimeOut(30000)
      //here, you can monitor the response results of all requests.
      .setResponseConfig(this.handleResponse)
      //param 1: isTokenExpired? , param 2: refreshToken http , param 3: refreshToken response
      .setRefreshTokenConfig(this.checkTokenExpired, this.refreshToken, (promise) => {
        promise.then((res) => {
          //Update token
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

  handleResponse = async(response, resolve, reject, data, xfetch) =>{
    if (response.ok) {
      if (!data.success) {// success is your server's custom fields
        // throw new Error(JSON.stringify(data))
        reject(data);
      } else {
        resolve(data);
        console.log('XFetch_success-->', response.url, data);
      }
    }else {
      reject(data);
      //TODO Authentication failed
      // if (response.status === 401){
      //   await XFetchConfig.getInstance()._refreshToken();
      //   //retry
      //   xfetch.do()
      // }
      console.log('XFetch_error-->', response.url, data);
      //do something...
      //for example, Toast.
    }
  };

  checkTokenExpired = () => {
    return isLogin && parseInt(tokenTime) + 30000 <= new Date().getTime();
  };

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

