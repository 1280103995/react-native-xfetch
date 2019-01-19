
import CustomXFetch from "./CustomXFetch";

export default class CustomModel {

  static fetchGet(view){
    const header = {
      'testHeader': 'test'
    };
    return new CustomXFetch(view,true).get('request').setHeaders(header, true).do()
  }

  static fetchPost(view){
    return new CustomXFetch(view,true).post('test_post').setHeaders(null).setParams({'test': 111}).do()
  }
}