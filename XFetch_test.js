import queryString from "query-string";

const REFRESH_TOKEN_SUCCESS = 'XFetch refresh token success';

class XFetchConfig {
  baseUrl: string;
  commonTimeOut: number = 30 * 1000;
  commonHeaders: Object = {'Content-Type': 'application/json'};

  responseFun: Function = () => null;
  refreshTokenPromise: Promise;
  isTokenRefreshing: boolean = false;
  checkTokenExpiredFun: Function = () => null;
  refreshTokenFun: Function = () => null;
  refreshTokenCallBackFun: Function = () => null;

  constructor() {
    if (!instance) {
      instance = this;
    }
    return instance;
  }

  static getInstance() {
    if (!instance) {
      instance = new XFetchConfig();
    }
    return instance;
  }

  _timeoutFetch(fetch_promise, time = 0) {
    let timeoutFun: Function;

    let timeout_promise = new Promise((resolve, reject) => {
      timeoutFun = () => {
        reject('XFetch request timed out')
      }
    }).catch((error) => {
    });

    setTimeout(() => {
      timeoutFun();
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
      this._timeoutFetch(fetch(url, option), timeout).then((response) => {
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
    this.refreshTokenPromise = new Promise((refreshTokenResolve, refreshTokenReject) => {
      const promise = new Promise((resolve, reject) => {
        this.refreshTokenFun()._doRefreshToken().then((res) => {
          refreshTokenResolve(REFRESH_TOKEN_SUCCESS);
          resolve(res)
        }).catch((error) => {
          refreshTokenReject(error);
          reject(error)
        })
      });
      this.refreshTokenCallBackFun && this.refreshTokenCallBackFun(promise)
    });
    this.refreshTokenPromise.finally(() => this.isTokenRefreshing = false);
    return this.refreshTokenPromise
  }

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
    return this
  }

  setCommonTimeOut(time: number) {
    this.commonTimeOut = time;
    return this
  }

  setCommonHeaders(headers: Object, isReplace: boolean = false) {
    if (isReplace) {
      this.commonHeaders = headers;
    } else {
      this.commonHeaders = Object.assign(this.commonHeaders, headers)
    }
    return this
  }

  setResponseConfig(responseFun: Function) {
    this.responseFun = responseFun;
    return this
  }

  setRefreshTokenConfig(checkTokenExpiredFun: Function, refreshTokenFun: Function, refreshTokenCallBack: Function) {
    this.checkTokenExpiredFun = checkTokenExpiredFun;
    this.refreshTokenFun = refreshTokenFun;
    this.refreshTokenCallBackFun = refreshTokenCallBack;
    return this
  }

}

let instance: ?XFetchConfig;

class XFetch {
  url: string;
  method: string;
  timeout: number = 0;
  headers: ?Object;
  params: ?Object;
  isForm: boolean = false;
  noHeaders: boolean = false;
  cookie: boolean = false;

  _doRefreshToken() {
    return instance._baseRequest(this);
  }

  _getUrl() {
    let tempUrl: string;
    if (this.url.startsWith('http') || this.url.startsWith('https')) {
      tempUrl = this.url
    } else {
      if (!instance.baseUrl) throw new Error('XFetch requires a base url');
      tempUrl = instance.baseUrl + this.url
    }
    return tempUrl
  }

  _getHeaders() {
    if (this.noHeaders && !this.headers) return null;
    if (!this.headers) return instance.commonHeaders;
    if (this.headers.hasOwnProperty('Authorization') && instance.commonHeaders.hasOwnProperty('Authorization')) {
      this.headers['Authorization'] = instance.commonHeaders['Authorization']
    }
    return this.headers
  }

  setTimeOut(time: number) {
    this.timeout = time;
    return this
  }

  setHeaders(header: Object, isReplace = false) {
    if (!header) {
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

  setParams(params: Object, isFormData = false) {
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
    if (!instance) throw new Error("Initialize XFetchConfig before using XFetch");
    if (instance.checkTokenExpiredFun() && instance.refreshTokenFun() && instance.refreshTokenCallBackFun()) {
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