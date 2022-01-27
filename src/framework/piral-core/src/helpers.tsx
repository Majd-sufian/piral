import {
  PiletApiCreator,
  LoadPiletsOptions,
  CustomSpecLoaders,
  DefaultLoaderConfig,
  getDefaultLoader,
  extendLoader,
  PiletLoader,
  PiletLifecycleHooks,
} from 'piral-base';
import { DebuggerExtensionOptions } from 'piral-debug-utils';
import { globalDependencies } from './modules';
import type { Pilet, PiletRequester, GlobalStateContext, PiletLoadingStrategy, DependencySelector } from './types';

export interface PiletOptionsConfig {
  context: GlobalStateContext;
  hooks?: PiletLifecycleHooks;
  loaders?: CustomSpecLoaders;
  loaderConfig?: DefaultLoaderConfig;
  availablePilets: Array<Pilet>;
  strategy: PiletLoadingStrategy;
  createApi: PiletApiCreator;
  loadPilet: PiletLoader;
  requestPilets: PiletRequester;
  shareDependencies: DependencySelector;
  debug?: DebuggerExtensionOptions;
}

export function createPiletOptions({
  hooks,
  context,
  loaders,
  loaderConfig,
  availablePilets,
  strategy,
  createApi,
  loadPilet,
  requestPilets,
  shareDependencies,
  debug,
}: PiletOptionsConfig) {
  const options: LoadPiletsOptions = {
    config: loaderConfig,
    strategy,
    loadPilet: extendLoader(loadPilet ?? getDefaultLoader(loaderConfig), loaders),
    createApi,
    pilets: availablePilets,
    fetchPilets: requestPilets,
    hooks,
    dependencies: shareDependencies(globalDependencies),
  };

  // if we build the debug version of piral (debug and emulator build)
  if (process.env.DEBUG_PIRAL) {
    const { integrate } = require('./debugger');
    integrate(context, options, debug);
  }

  // if we build the emulator version of piral (shipped to pilets)
  if (process.env.DEBUG_PILET) {
    const { integrate } = require('./emulator');
    integrate(context, options);
  }

  return options;
}
