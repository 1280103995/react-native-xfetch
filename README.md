# react-native-xfetch

## XFetch Supports 

1. refreshToken
2. setTimeOut()
3. setHeaders()
4. setParams()
5. useCookie()
6. get()
7. post()
8. put()
9. delete()

# how to use

## Step 1:
    yarn add react-native-xfetch  or  npm i react-native-xfetch --save
    
## Step 2:
    init XFetch: 
    
    1)  import {XFetch, XFetchConfig} from "react-native-xfetch";
    2) 
        //set the public header like this
        const commonHeader = {
          'Content-Type': 'application/json',
          'platform': 'android or ios',
          'deviceId': '6f580xxxxxx-e7aaaaaaaa0'
        };
        
        XFetchConfig.getInstance()
          .setBaseUrl('http host')
          .setCommonHeaders(commonHeader)
          .setCommonTimeOut(30000)
          //here, you can monitor the response results of all requests.
          .setResponseConfig(this.handleResponse)
          //param 1: isTokenExpired? , param 2: refreshToken http , param 3: refreshToken response
          .setRefreshTokenConfig(this.checkTokenExpired, this.refreshToken, (promise) => {
             promise.then((res) => {
               ...
             }).catch((error) => {
               ...
             }) 
          })
          
          
        ......
          
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
        
        
        checkTokenExpired = () => isTokenExpired;
        
        refreshToken = () => new XFetch().post('refresh_token').setHeaders(...).setParams(...) //please do not use the do() here.
       
## Step 3: 
    normal use: 
    
       import {XFetch} from "react-native-xfetch";
    
       let promise = new XFetch().get('http address').setHeaders(...).setParams(...).do().then((res) => {
          ...
       }).catch((error) => {
          ...
       });
       
       
       let promise1 = new XFetch().post('http address').setHeaders(...).setParams(..., isFormData = false).do().then((res) => {
          ...
       }).catch((error) => {
          ...
       });
    
## defaultProps
1. timeout: 30s
2. header: 'Content-Type': 'application/json'
3. If your request parameter is a form and setParams(params, true) is used, the header's 'Content-Type' value will be set to     'multipart/form-data'
4. setHeaders(null): this request has no request header
5. setHeaders(header, isReplace = false): merge this header and commonHeader
6. setHeaders(header, isReplace = true): only use this header

## Run demo

The token validity period is 30s, and the refresh token is valid for 60s.

1. `git clone https://github.com/1280103995/react-native-xfetch.git`

2. `cd react-native-xfetch && npm install`

3. `cd server && node refresh_token.js` run http service

4. `don't forget to modify the BaseUrl`

5. `react-native run-android` or `react-native run-ios`


## License
The MIT License.

