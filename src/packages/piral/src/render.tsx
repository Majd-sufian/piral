import * as React from 'react';
import { isfunc } from 'react-arbiter';
import { render } from 'react-dom';
import { Provider } from 'urql';
import { createInstance, setupState, EventEmitter, PiletApi } from 'piral-core';
import {
  createFetchApi,
  createGqlApi,
  createLocaleApi,
  createUserApi,
  setupGqlClient,
  setupLocalizer,
  gqlQuery,
  gqlMutation,
  gqlSubscription,
} from 'piral-ext';
import { createTranslationsActions } from './actions';
import { getGateway, getContainer, getAvailablePilets, getPiletRequester, getLoader } from './utils';
import { PiralOptions, PiletQueryResult, PiletsBag } from './types';

function defaultExtendApi(api: PiletApi) {
  return api;
}

function defaultLoader(): Promise<undefined> {
  return Promise.resolve(undefined);
}

const piletsQuery = `query initialData {
  pilets {
    hash
    link
    name
    version
  }
}`;

/**
 * Sets up a new Piral instance and renders it using the provided options.
 * Can be used as simple as calling the function directly without any
 * arguments.
 * @param options The options to use when setting up the Piral instance.
 * @example
```tsx
import { renderInstance } from 'piral';
import { layout } from './my-layout';
renderInstance({ layout });
export * from 'piral';
```
 */
export function renderInstance(options: PiralOptions): Promise<EventEmitter> {
  const {
    selector = '#app',
    gatewayUrl,
    subscriptionUrl,
    loader = defaultLoader,
    config = {},
    gql = {},
    layout,
  } = options;
  const [AppLayout, initialState] = layout.build();
  const load = getLoader(loader, config);
  const base = getGateway(gatewayUrl);
  const client = setupGqlClient({
    url: base,
    subscriptionUrl,
    ...gql,
  });
  const uri = {
    base,
    ...config.fetch,
  };
  const renderLayout = (content: React.ReactNode) => <AppLayout>{content}</AppLayout>;
  const defaultRequestPilets = () => gqlQuery<PiletQueryResult>(client, piletsQuery).then(({ pilets }) => pilets);

  return load({
    fetch: (url, options) => createFetchApi(uri).fetch(url, options),
    query: (query, options) => gqlQuery(client, query, options),
    mutate: (mutation, options) => gqlMutation(client, mutation, options),
    subscribe: (subscription, subscriber, options) => gqlSubscription(client, subscription, subscriber, options),
  }).then(
    ({
      pilets = defaultRequestPilets,
      translations = {},
      extendApi = defaultExtendApi,
      attach,
      actions,
      fetch: fetchOptions = uri,
      locale: localeOptions = config.locale,
      state: explicitState,
      ...forwardOptions
    } = {}) => {
      const apis: PiletsBag = {};
      const messages = Array.isArray(translations)
        ? translations.reduce((prev, curr) => {
            prev[curr] = {};
            return prev;
          }, {})
        : translations;
      const state = setupState(
        {
          ...initialState,
          languages: Object.keys(messages),
        },
        explicitState,
      );
      const localizer = setupLocalizer({
        language: state.app.language.selected,
        messages,
        ...localeOptions,
      });
      const Piral = createInstance({
        ...forwardOptions,
        availablePilets: getAvailablePilets(),
        requestPilets: getPiletRequester(pilets),
        actions: {
          ...actions,
          ...createTranslationsActions(localizer, apis),
        },
        extendApi(api, target) {
          const newApi: any = {
            ...createFetchApi(fetchOptions),
            ...createGqlApi(client),
            ...createLocaleApi(localizer),
            ...createUserApi(),
            ...api,
          };
          apis[target.name] = newApi;
          return extendApi(newApi, target) as any;
        },
        state,
      });

      if (isfunc(attach)) {
        attach(Piral.root);
      }

      Piral.on('change-language', ev => {
        localizer.language = ev.selected;
      });

      const App: React.FC = () => (
        <Provider value={client}>
          <Piral.App>{renderLayout}</Piral.App>
        </Provider>
      );

      render(<App />, getContainer(selector));
      return Piral;
    },
  );
}
