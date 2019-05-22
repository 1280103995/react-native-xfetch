import queryString from "query-string";

const REFRESH_TOKEN_SUCCESS = 'XFetch refresh token success';
const TIME_OUT = 'XFetch request timed out';
const No_BASE_URL = 'XFetch requires a base url';
const NO_INITIALIZE = 'Initialize XFetchConfig before using XFetch';
let instance = null;

class XFetchConfig {
  baseUrl: string;
  commonTimeOut: number = 30 * 1000;
  commonHeaders: Object = {'Content-Type': 'application/json'};
  commonHeadersFun: Function = () => null;
  responseFun: Function;

  refreshTokenPromise: ?Promise;
  isTokenRefreshing: boolean = false;
  isTokenExpired: Function = () => null;
  refreshTokenFunc: Function;
  refreshTokenCallBackFunc: Function;

  constructor() {
    if (!instance) {
      instance = this;
    }
    return instance;
  }

  static getInstance() {
    if (instance == null) {
      instance = new XFetchConfig();
    }
    return instance;
  }

  _timeoutFetch(fetch_promise, time = 0, xfetch: XFetch) {
    let timeoutFunc = null;

    let timeout_promise = new Promise((resolve, reject) => {
      timeoutFunc = () => {
        let option = {
          ok: false,
          status: 408,
          statusText: TIME_OUT,
          headers: xfetch._getHeaders(),
          url: xfetch._getUrl()
        };
        let response = new Response(null, option);
        resolve(response)
      }
    });

    setTimeout(() => {
      timeoutFunc();
    }, time === 0 ? this.commonTimeOut : time);

    return Promise.race([fetch_promise, timeout_promise])
  }

  _baseRequest(xfetch: XFetch) {
    let method = xfetch.method;
    let url = xfetch._getUrl();
    let params = xfetch._getParams();
    let isFormData = xfetch.isFormData;
    let header = xfetch._getHeaders();
    let timeout = xfetch.timeout;
    let cookie = xfetch.cookie;

    if (method === 'GET' && params !== null) {
      url += '?' + queryString.stringify(params);
      params = null
    }

    let option = params === null ? {
      method: method,
      headers: header
    } : {
      method: method,
      headers: header,
      body: isFormData ? params : JSON.stringify(params)
    };

    if (cookie) option.credentials = 'include';

    return new Promise((resolve, reject) => {
      let cbResponse: Response;
      this._timeoutFetch(fetch(url, option), timeout, xfetch).then((response) =>{
        cbResponse = response;
        if (response.ok) return response.json();
        else throw new Error(JSON.stringify(response))
      }).then((responseData) => {
        if (this.responseFun) this.responseFun(true, cbResponse, resolve, reject, responseData);
        else resolve(responseData)
      }).catch((error) => {
        if (this.responseFun) this.responseFun(false, cbResponse, resolve, reject, error);
        else reject(error)
      })
    })
  }

  async _refreshToken() {
    if (this.isTokenRefreshing) return await this.refreshTokenPromise;
    this.isTokenRefreshing = true;
    this.refreshTokenPromise =  new Promise((refreshTokenResolve, refreshTokenReject) => {
      const promise = new Promise((resolve, reject) => {
        this.refreshTokenFunc()._doRefreshToken().then((res) => {
          refreshTokenResolve(REFRESH_TOKEN_SUCCESS);
          resolve(res)
        }).catch((error) => {
          refreshTokenReject(error);
          reject(error)
        })
      });
      this.refreshTokenCallBackFunc && this.refreshTokenCallBackFunc(promise)
    });
    this.refreshTokenPromise.finally(() => this.isTokenRefreshing = false);
    return this.refreshTokenPromise
  }

  setResponseConfig(responseFun: Function){
    this.responseFun = responseFun;
    return this
  }

  setRefreshTokenConfig(expired: Function, refreshTokenFun: Function, refreshTokenCallBack: Function) {
    if (refreshTokenFun != null) {
      this.isTokenExpired = expired;
      this.refreshTokenFunc = refreshTokenFun;
      this.refreshTokenCallBackFunc = refreshTokenCallBack
    }
    return this
  }

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
    return this
  }

  setCommonTimeOut(time: number) {
    this.commonTimeOut = time;
    return this
  }

  setCommonHeaders(commonHeaders: Object | Function){
    if (typeof commonHeaders === 'object'){
      this.commonHeaders = commonHeaders
    } else {
      this.commonHeadersFun = commonHeaders;
    }
    return this
  }

}

class XFetch {
  url: string;
  method: string;
  timeout: number = 0;
  headers: Object;
  headersFun: Function = ()=> null;
  isReplaceAllHeaders: boolean = false;
  params: Object = null;
  paramsFun: Function = () => null;
  isFormData: boolean = false;
  cookie: boolean = false;

  _doRefreshToken(){
    return instance._baseRequest(this);
  }

  _getUrl() {
    let tempUrl: string;
    if (this.url.startsWith('http') || this.url.startsWith('https')) {
      tempUrl = this.url
    } else {
      if (!instance.baseUrl) throw new Error(No_BASE_URL);
      tempUrl = instance.baseUrl + this.url
    }
    return tempUrl
  }

  _getHeaders(){
    if (this.isReplaceAllHeaders){
      return this.headersFun() != null ? this.headersFun() : this.headers;
    }
    const commonHeaders = instance.commonHeadersFun() != null ? instance.commonHeadersFun() : instance.commonHeaders;
    let headers = this.headersFun() != null ? this.headersFun() : this.headers;
    headers = Object.assign(commonHeaders, headers);
    return headers
  }

  _getParams(){
    return this.paramsFun() != null ? this.paramsFun() : this.params;
  }

  setTimeOut(time: number) {
    this.timeout = time;
    return this
  }

  setHeaders(headers: Object | Function, isReplace: boolean = false) {
    if (typeof headers === 'object'){
      this.headers = headers;
    }else {
      this.headersFun = headers;
    }
    this.isReplaceAllHeaders = isReplace;
    return this
  }

  setParams(params: Object | Function, isFormData = false) {
    if (typeof params === 'object'){
      this.params = params;
    }else {
      this.paramsFun = params;
    }
    this.isFormData = isFormData;
    return this
  }

  useCookie(use: boolean){
    this.cookie = use;
    return this
  }

  get(url: string) {
    this.url = url;
    this.method = 'GET';
    return this
  }

  post(url: string) {
    this.url = url;
    this.method = 'POST';
    return this
  }

  put(url: string) {
    this.url = url;
    this.method = 'PUT';
    return this
  }

  delete(url: string) {
    this.url = url;
    this.method = 'DELETE';
    return this
  }

  async do() {
    if (!instance) throw new Error(NO_INITIALIZE);
    if (instance.isTokenExpired()) {
      let promise = await instance._refreshToken();
      if (promise !== REFRESH_TOKEN_SUCCESS) {
        return Promise.reject(promise);
      }
    }
    return instance._baseRequest(this);
  }
}

export {
  XFetchConfig,
  XFetch
}