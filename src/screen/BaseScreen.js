import React from "react";

export default class BaseScreen extends React.Component{

  showLoading(msg){
    console.log("请求："+msg)
  }

  render(){
    return super.render();
  }
}