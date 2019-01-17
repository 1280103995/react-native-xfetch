import StackViewStyleInterpolator from "react-navigation-stack/dist/views/StackView/StackViewStyleInterpolator";
import {createStackNavigator} from "react-navigation";
import LoginScreen from "../screen/LoginScreen";
import HomeScreen from "../screen/HomeScreen";

const nav = {
  Home: {screen: HomeScreen},
  Login: {screen: LoginScreen}
};

export default AppNavigator = createStackNavigator(
  nav,
  {
    initialRouteName: 'Home',
    mode: 'card',
    headerMode: 'screen',
    transitionConfig: () => ({
      screenInterpolator: StackViewStyleInterpolator.forHorizontal,
    })
  }
);