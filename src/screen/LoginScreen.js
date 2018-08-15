import React from 'react';
import {Button, Text, TextInput, View} from "react-native";
import {XFetch, XFetchConfig} from "../../XFetch";

export default class LoginScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      mobile: 'xxxxx',
      pwd: '123456'
    };
  }

  _login = () => {
    new XFetch().get('get_token').do().then((res)=>{
      //after login success, add "Authorization" to HTTP header
      XFetchConfig.getInstance()
        .setCommonHeaders({
          'Authorization': res.data.token
        });

      tokenTime = res.data.token;
      isLogin = true;
      this.props.navigation.goBack()
    })
  };

  render() {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <View style={{flexDirection: 'row', alignItems: 'center',marginVertical: 10}}>
          <Text>account </Text>
          <TextInput
            style={{width:200, borderColor:'gray',borderWidth:1}}
            value={this.state.mobile}
            onChangeText={(text) => {
              this.setState({
                mobile:text
              })
            }}
          />
        </View>
        <View style={{flexDirection: 'row', marginVertical: 10}}>
          <Text>password </Text>
          <TextInput
            style={{width:200, borderColor:'gray',borderWidth:1}}
            value={this.state.pwd}
            onChangeText={(text) => {
              this.setState({
                pwd:text
              })
            }}
          />
        </View>
        <Button title='login' onPress={this._login}/>
      </View>
    )
  }
}