import React from 'react';
import {Button, RefreshControl, ScrollView, Text} from "react-native";
// import {XFetch} from "../../XFetch";
import {XFetch} from "react-native-xfetch";

export default class HomeScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      refreshState: false
    };
  }

  _login = () => {
    this.props.navigation.navigate('Login')
  };

  _getHeader = () => {
    return {
      'testReplaceAllHeaders': 'function',
      'authorization': tokenTime
    }
  };

  _onRefresh = () => {
    if (!isLogin) {
      alert('unlogin');
      return
    }

    this.setState({refreshState: true});

    //test: only use this header
    let home = new XFetch().get('request').setHeaders(this._getHeader, true).do().then((res) => {

    }).catch((error) => {

    });

    //test: post request
    const headers = {
      'testReplaceAllHeaders': 'const',
      'authorization': tokenTime
    };
    let praise = new XFetch().post('test_post').setHeaders(headers).setParams({'test': 111}).do().then(() => {

    }).catch((e) => {

    });

    //test: formData upload
    const headersFormData = {
      'testFormData': 'upload',
      'Content-Type': 'multipart/form-data',
    };
    let formData = new FormData();
    formData.append('test', 111);
    let upload = new XFetch().post('upload').setHeaders(headersFormData).setParams(formData, true).do().then(() => {

    }).catch((e) => {

    });

    Promise.all([home, praise, upload]).finally(() => this.setState({refreshState: false}))
  };

  render() {
    return (
      <ScrollView
        contentContainerStyle={{flex: 1, justifyContent:'center', alignItems: 'center'}}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshState}
            onRefresh={this._onRefresh}
            tintColor="#ff0000"
            title="Loading..."
            titleColor="#00ff00"
            colors={['#ff0000', '#00ff00', '#0000ff']}
            progressBackgroundColor={'white'}/>
        }
      >
        <Text>pull down test request</Text>
        <Button title='login' onPress={this._login} />
      </ScrollView>
    )
  }
}