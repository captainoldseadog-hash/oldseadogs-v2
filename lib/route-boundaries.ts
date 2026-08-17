export function isEditorPath(pathname: string) {
  return pathname === "/editor" || pathname.startsWith("/editor/");
}

export function isPublicPagePath(pathname: string) {
  return !isEditorPath(pathname) && !pathname.startsWith("/api/");
}
