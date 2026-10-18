export function isEditorPath(pathname: string) {
  return pathname === "/editor" || pathname.startsWith("/editor/");
}

export function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isPublicPagePath(pathname: string) {
  return !isEditorPath(pathname) && !pathname.startsWith("/api/");
}

export function isAdsenseLoaderPath(pathname: string) {
  return isPublicPagePath(pathname) && !isAdminPath(pathname);
}
