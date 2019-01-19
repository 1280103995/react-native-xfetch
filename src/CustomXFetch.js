// import {XFetch} from "react-native-xfetch";
import BaseScreen from "./screen/BaseScreen";
import {XFetch} from "../XFetch";

export default class CustomXFetch extends XFetch {

    constructor(view: BaseScreen = null, loading: Boolean = false) {
      super();
      this.view = view;
      this.loading = loading;
    }

    onStart(){
      if(this.view !== null && this.loading){
        this.view.showLoading('网络请求开始')
      }
    }

    onError(error){
      if(this.view !== null){
        this.view.showLoading('网络请求出错：' + JSON.stringify(error))
      }
    }

    onComplete(){
      if(this.view !== null){
        this.view.showLoading('网络请求完成')
      }
    }
}