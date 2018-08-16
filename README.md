# react-native-xfetch

## XFetch Supports 

1. refreshToken   (See in App.js)
2. setTimeOut()
3. setHeaders()
4. setParams()
5. get()
6. post()
7. put()
8. delete()

# how to use

## Step 1:
    I can't use npm to publish this library. So if you want to use this library, 
    please `yarn add query-string` in your project and download `XFetch.js` to your project.
    
## Step 2:
    init XFetch: 
    
    1)  import {XFetch, XFetchConfig} from "./XFetch";
    2) 
        //set all request heads
        const commonHeader = {
          'Content-Type': 'application/json',
          'platform': 'android',
          'deviceId': '6f580xxxxxx-e7aaaaaaaa0'
        };
        
        XFetchConfig.getInstance()
          .setBaseUrl('Your host')
          .setCommonHeaders(commonHeader)
          .setCommonTimeOut(30000)
          //here, you can monitor the response results of all requests.
          .setResponseConfig(this.handleResponse)
          //param 1: isTokenExpired? , param 2: refreshToken http , param 3: refreshToken response
          .setRefreshTokenConfig(this.checkTokenExpired, this.refreshToken, (promise) => {
             ... 
          })
          
          
        ...
          
        handleResponse = (isResponseSuccess, url, resolve, reject, data) =>{
          if (isResponseSuccess) {
            
          }else {
            
          }
        };
        
        
        checkTokenExpired = () => isTokenExpired;
        
        refreshToken = () => new XFetch().post('refresh_token') //please do not use the do() here.
       
## Step 3: 
    normal use: 
    
       import {XFetch} from "./XFetch";
    
       let promise = new XFetch().get('your address').do().then((res) => {
          ...
       }).catch((error) => {
          ...
       });
    
## defaultProps
1. timeout: 30s
2. header: 'Content-Type': 'application/json'
3. If your request parameter is a form and setParams(params, true) is used, the header's 'Content-Type' value will be set to     'multipart/form-data'

## Run demo

1. `git clone https://github.com/1280103995/react-native-xfetch.git`

2. `cd react-native-xfetch && npm install`

3. `cd server && node refresh_token.js` run http service

4. `react-native run-android` or `react-native run-ios`

------
## See demo for more information.

