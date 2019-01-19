import BaseViewModel from "./BaseViewModel";
import CustomModel from "./CustomModel";

export default class CustomViewModel extends BaseViewModel{

    fetchData() {
      CustomModel.fetchGet(this.view).then((res)=>{

      }).catch((err)=>{

      });
      //post
      CustomModel.fetchPost(this.view).then((res)=>{

      }).catch((err)=>{

      })
    }
}