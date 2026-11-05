'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { Provider as ReduxProvider } from 'react-redux';
import { reduxStore } from './stores/redux';
import theme from '../theme';
import { installSessionHandling } from './lib/session';

// Interceptores de axios + seguimiento de actividad (una sola vez, en el cliente).
if (typeof window !== 'undefined') installSessionHandling();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={reduxStore}>
      <ChakraProvider theme={theme}>{children}</ChakraProvider>
    </ReduxProvider>
  );
}
