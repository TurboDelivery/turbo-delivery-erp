'use client';
import App from '@/App';
import store from '@/store';
import { Provider } from 'react-redux';
import React, { ReactNode, Suspense } from 'react';
// import { appWithI18Next } from 'ni18n';
// import { ni18nConfig } from 'ni18n.config.ts';
import Loading from '@/components/layouts/loading';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface IProps {
  children?: ReactNode;
}

const queryClient = new QueryClient();
const ProviderComponent = ({ children }: IProps) => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<Loading />}>
          <App>{children} </App>
        </Suspense>
      </QueryClientProvider>
    </Provider>
  );
};

export default ProviderComponent;
