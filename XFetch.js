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
  commonHeadersFunc: ?Function;
  responseFunc: ?Function;

  refreshTokenPromise: ?Promise;
  isTokenRefreshing: boolean = false;
  isTokenExpired: ?Function;
  refreshTokenFunc: ?Function;
  refreshTokenCallBack: ?Function;

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
    let timeoutFun = null;

    let timeout_promise = new Promise((resolve, reject) => {
      timeoutFun = () => {
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
      timeoutFun();
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
      xfetch.onStart();
      let cbResponse: Response;
      this._timeoutFetch(fetch(url, option), timeout, xfetch).then((response) => {
        cbResponse = response;
        if (response.ok) return response.json();
        else throw new Error(JSON.stringify(response))
      }).then((responseData) => {
        if (this.responseFunc) this.responseFunc(cbResponse, resolve, reject, responseData, xfetch);
        else resolve(responseData)
      }).catch((error) => {
        if (this.responseFunc) this.responseFunc(cbResponse, resolve, reject, error, xfetch);
        else reject(error)
      }).finally(()=>{
        xfetch.onComplete();
      })
    })
  }

  async _refreshToken() {
    if (this.isTokenRefreshing) return await this.refreshTokenPromise;
    this.isTokenRefreshing = true;
    this.refreshTokenPromise = new Promise((refreshTokenResolve, refreshTokenReject) => {
      const promise = new Promise((resolve, reject) => {
        this.refreshTokenFunc()._doRefreshToken().then((res) => {
          refreshTokenResolve(REFRESH_TOKEN_SUCCESS);
          resolve(res)
        }).catch((error) => {
          refreshTokenReject(error);
          reject(error)
        })
      });
      this.refreshTokenCallBack(promise)
    });
    this.refreshTokenPromise.finally(() => this.isTokenRefreshing = false);
    return this.refreshTokenPromise
  }

  setResponseConfig(responseFunc: Function) {
    this.responseFunc = responseFunc;
    return this
  }

  setRefreshTokenConfig(expired: Function, refreshTokenFunc: Function, refreshTokenCallBack: Function) {
    this.isTokenExpired = expired;
    this.refreshTokenFunc = refreshTokenFunc;
    this.refreshTokenCallBack = refreshTokenCallBack;
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

  setCommonHeaders(commonHeaders: Object | Function) {
    if (typeof commonHeaders === 'object') {
      this.commonHeaders = commonHeaders
    } else {
      this.commonHeadersFunc = commonHeaders;
    }
    return this
  }

}

class XFetch {
  url: string;
  method: string;
  timeout: number = 0;
  headers: Object;
  headersFunc: ?Function;
  isReplaceAllHeaders: boolean = false;
  params: Object = null;
  paramsFunc: ?Function;
  isFormData: boolean = false;
  cookie: boolean = false;

  onStart(){

  }

  onComplete(){

  }

  /**
   * Only used when the token expires
   * @private
   */
  _doRefreshToken() {
    return instance._baseRequest(this);
  }

  /**
   * compute url
   * @returns {string}
   * @private
   */
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

  /**
   * compute headers
   * @returns {*}
   * @private
   */
  _getHeaders() {
    if (this.isReplaceAllHeaders) {
      return this.headersFunc ? this.headersFunc() : this.headers;
    }
    const commonHeaders = instance.commonHeadersFunc ? instance.commonHeadersFunc() : instance.commonHeaders;
    let headers = this.headersFunc ? this.headersFunc() : this.headers;
    headers = Object.assign(commonHeaders, headers);
    return headers
  }

  /**
   * compute params
   * @returns {Object}
   * @private
   */
  _getParams() {
    return this.paramsFunc ? this.paramsFunc() : this.params;
  }

  setTimeOut(time: number) {
    this.timeout = time;
    return this
  }

  setHeaders(headers: Object | Function, isReplace: boolean = false) {
    if (typeof headers === 'object') {
      this.headers = headers;
    } else {
      this.headersFunc = headers;
    }
    this.isReplaceAllHeaders = isReplace;
    return this
  }

  setParams(params: Object | Function, isFormData = false) {
    if (typeof params === 'object') {
      this.params = params;
    } else {
      this.paramsFunc = params;
    }
    this.isFormData = isFormData;
    return this
  }

  useCookie(use: boolean) {
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
    if (instance.isTokenExpired && instance.isTokenExpired() && instance.refreshTokenFunc && instance.refreshTokenCallBack) {
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