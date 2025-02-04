import type { HtmlComponent } from 'piral-core';
import { createConverter } from './lib/converter';

export interface SvelteConverter {
  (...params: Parameters<ReturnType<typeof createConverter>>): HtmlComponent<any>;
}

export function createSvelteConverter(...params: Parameters<typeof createConverter>) {
  const convert = createConverter(...params);
  const Extension = convert.Extension;
  const from: SvelteConverter = (Component, captured) => ({
    type: 'html',
    component: convert(Component, captured),
  });

  return { from, Extension };
}

const { from: fromSvelte, Extension: SvelteExtension } = createSvelteConverter();

export { fromSvelte, SvelteExtension };
