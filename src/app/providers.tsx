'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { Provider as ReduxProvider } from 'react-redux';
import { reduxStore } from './stores/redux';
import theme from '../theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={reduxStore}>
      <ChakraProvider theme={theme}>{children}</ChakraProvider>
    </ReduxProvider>
  );
}
