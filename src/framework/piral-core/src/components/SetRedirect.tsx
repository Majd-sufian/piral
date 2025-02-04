import * as React from 'react';
import { Redirect } from 'react-router';
import { useGlobalStateContext, useSetter } from '../hooks';

/**
 * The props for the SetRedirect component.
 */
export interface SetRedirectProps {
  /**
   * The path of the seen route.
   */
  from: string;
  /**
   * The path of the target route.
   */
  to: string;
}

/**
 * The component capable of setting a global redirect route at mounting.
 */
export function SetRedirect({ from, to }: SetRedirectProps): React.ReactElement {
  const { setRoute } = useGlobalStateContext();
  useSetter(() => setRoute(from, () => <Redirect to={to} />));
  // tslint:disable-next-line:no-null-keyword
  return null;
}
