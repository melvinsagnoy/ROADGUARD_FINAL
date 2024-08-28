// App.js
import React, { useState } from 'react';
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';
import AuthNavigator from './navigation/AuthNavigator';

const App = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const toggleTheme = () => {
    setIsDarkTheme((prevTheme) => !prevTheme);
  };

  const theme = isDarkTheme ? DarkTheme : DefaultTheme;

  return (
    <PaperProvider theme={theme}>
      <AuthNavigator toggleTheme={toggleTheme} isDarkTheme={isDarkTheme} />
    </PaperProvider>
  );
};

export default App;