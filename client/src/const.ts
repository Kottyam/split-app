export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const API_ORIGIN = "https://kharchasplit-rlsqgpta.manus.space";

// Android bundles the UI locally, but authentication must complete on the
// live Kharcha server so its session cookie remains scoped to the API host.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${API_ORIGIN}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
