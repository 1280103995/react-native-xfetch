import queryString from "query-string";

const REFRESH_TOKEN_SUCCESS = 'refresh token success';
let instance = null;

class XFetchConfig {
  baseUrl = null;
  commonTimeOut = 30 * 1000;
  commonHeader = {'Content-Type': 'application/json; charset=utf-8'};

  responseFunc: Function;
  refreshTokenPromise = null;
  isTokenRefreshing = false;
  isTokenExpired: Function;
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

  async _baseRequest(method, url, params = null, isFormData = false, header = null, timeout) {

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
      this.commonHeader = headers;
    } else {
      this.commonHeader = Object.assign(this.commonHeader, headers)
    }
    return this
  }

}

class XFetch {
  tempUrl = null;
  method = null;
  timeout = 0;
  tempHeader = null;
  params = null;
  isForm = false;

  _doRefreshToken(){
    return instance._baseRequest(this.method, this._getUrl(), this.params, this.isForm, this._getHeaders(), this.timeout);
  }

  _getUrl() {
    let url = null;
    if (this.tempUrl.startsWith('http') || this.tempUrl.startsWith('https')) {
      url = this.tempUrl
    } else {
      url = instance.baseUrl + this.tempUrl
    }
    return url
  }

  _getHeaders(){
    if (this.tempHeader != null
      && this.tempHeader.hasOwnProperty('Authorization')
      && instance.commonHeader.hasOwnProperty('Authorization')){
      this.tempHeader['Authorization'] = instance.commonHeader['Authorization']
    }
    return this.tempHeader
  }

  setTimeOut(time: number) {
    this.timeout = time;
    return this
  }

  setHeaders(header, isReplace = false) {
    if (isReplace) {
      this.tempHeader = header;
    } else {
      const tempHeader = JSON.parse(JSON.stringify(instance.commonHeader));
      this.tempHeader = Object.assign(tempHeader, header);
    }
    return this
  }

  setParams(params, isFormData = false) {
    this.params = params;
    if (isFormData) {
      const header = {
        'Content-Type': 'multipart/form-data',
      };
      const tempHeader = JSON.parse(JSON.stringify(instance.commonHeader));
      this.tempHeader = Object.assign(tempHeader, header);
      this.isForm = true;
    }
    return this
  }

  get(url: string) {
    this.tempUrl = url;
    this.method = 'GET';
    return this
  }

  post(url: string) {
    this.tempUrl = url;
    this.method = 'POST';
    return this
  }

  put(url: string) {
    this.tempUrl = url;
    this.method = 'PUT';
    return this
  }

  delete(url: string) {
    this.tempUrl = url;
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
    return instance._baseRequest(this.method, this._getUrl(), this.params, this.isForm, this._getHeaders(), this.timeout);
  }
}

export {
  XFetchConfig,
  XFetch
}