import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export function getAuthRedirectUri() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/callback`;
  }

  return makeRedirectUri({
    scheme: 'gripkitchen',
    path: 'callback',
  });
}

export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (!accessToken || !refreshToken) {
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signInWithGoogle() {
  const redirectTo = getAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });

  if (error) {
    throw error;
  }

  if (Platform.OS === 'web') {
    if (data.url) {
      window.location.assign(data.url);
    }
    return;
  }

  if (!data.url) {
    throw new Error('No OAuth URL returned from Supabase.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success') {
    await createSessionFromUrl(result.url);
    return;
  }

  if (result.type === 'cancel') {
    return;
  }

  throw new Error('Google sign-in was not completed.');
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export function subscribeToAuthDeepLinks(onUrl: (url: string) => void) {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    onUrl(url);
  });

  Linking.getInitialURL().then((url) => {
    if (url) {
      onUrl(url);
    }
  });

  return () => subscription.remove();
}
