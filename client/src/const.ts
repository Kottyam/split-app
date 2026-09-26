export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Local-first Kharcha has no hosted authentication portal. */
export const getLoginUrl = () => {
  if (typeof window === "undefined") return "/";
  return window.location.origin + "/";
};
