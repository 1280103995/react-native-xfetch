import React from 'react';
import {Button, RefreshControl, ScrollView} from "react-native";
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

  _onRefresh = () => {
    this.setState({refreshState: true});
    if (!isLogin) {
      alert('unlogin');
      return
    }
    //test: only use this header
    const header = {
      'testHeader': 'test'
    };
    let home = new XFetch().get('request').setHeaders(header, true).do().then((res) => {

    }).catch((error) => {

    });

    //test: this request has no request header
    let praise = new XFetch().post('test_post').setHeaders(null).setParams({'test': 111}).do().then(() => {

    }).catch((e) => {

    });

    Promise.all([home, praise]).finally(() => this.setState({refreshState: false}))
  };

  render() {
    return (
      <ScrollView
        contentContainerStyle={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
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
        <Button title='login' onPress={this._login}/>
      </ScrollView>
    )
  }
}