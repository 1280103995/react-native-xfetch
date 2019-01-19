import queryString from "query-string";

const REFRESH_TOKEN_SUCCESS = 'refresh token success';
let instance = null;

class XFetchConfig {
  baseUrl = null;
  commonTimeOut = 30 * 1000;
  commonHeaders = {'Content-Type': 'application/json'};

  responseFunc: Function;
  refreshTokenPromise = null;
  isTokenRefreshing = false;
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

  _timeoutFetch(fetch_promise, time = 0) {
    let timeoutFunc = null;

    let timeout_promise = new Promise((resolve, reject) => {
      timeoutFunc = () => {
        reject('request timeout')
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
    let params = xfetch.params;
    let isFormData = xfetch.isForm;
    let header = xfetch._getHeaders();
    let timeout = xfetch.timeout;

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

    return new Promise((resolve, reject) => {
      this._timeoutFetch(fetch(url, option), timeout).then((response) =>{
        if (response.ok) return response.json();
        else throw new Error(JSON.stringify(response))
      }).then((responseData) => {
        if (this.responseFunc) this.responseFunc(true, url, resolve, reject, responseData);
        else resolve(responseData)
      }).catch((error) => {
        if (this.responseFunc) this.responseFunc(false, url, resolve, reject, error);
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

  setResponseConfig(responseFunc: Function){
    this.responseFunc = responseFunc;
    return this
  }

  setRefreshTokenConfig(expired: Function, refreshTokenFunc: Function, refreshTokenCallBack: Function) {
    if (refreshTokenFunc != null) {
      this.isTokenExpired = expired;
      this.refreshTokenFunc = refreshTokenFunc;
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

  setCommonHeaders(headers, isReplace = false) {
    if (isReplace) {
      this.commonHeaders = headers;
    } else {
      this.commonHeaders = Object.assign(this.commonHeaders, headers)
    }
    return this
  }

}

class XFetch {
  url = null;
  method = null;
  timeout = 0;
  headers = null;
  params = null;
  isForm = false;
  noHeaders = false;

  _doRefreshToken(){
    return instance._baseRequest(this);
  }

  _getUrl() {
    let tempUrl = null;
    if (this.url.startsWith('http') || this.url.startsWith('https')) {
      tempUrl = this.url
    } else {
      tempUrl = instance.baseUrl + this.url
    }
    return tempUrl
  }

  _getHeaders(){
    if (this.noHeaders && this.headers == null) return null;
    if (this.headers == null) return instance.commonHeaders;
    if (this.headers.hasOwnProperty('Authorization') && instance.commonHeaders.hasOwnProperty('Authorization')){
      this.headers['Authorization'] = instance.commonHeaders['Authorization']
    }
    return this.headers
  }

  setTimeOut(time: number) {
    this.timeout = time;
    return this
  }

  setHeaders(header, isReplace = false) {
    if (header == null){
      this.noHeaders = true
    } else {
      if (isReplace) {
        this.headers = header;
      } else {
        const tempHeaders = JSON.parse(JSON.stringify(instance.commonHeaders));
        this.headers = Object.assign(tempHeaders, header);
      }
    }
    return this
  }

  setParams(params, isFormData = false) {
    this.params = params;
    if (isFormData) {
      const header = {
        'Content-Type': 'multipart/form-data',
      };
      const tempHeaders = JSON.parse(JSON.stringify(instance.commonHeaders));
      this.headers = Object.assign(tempHeaders, header);
      this.isForm = true;
    }
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