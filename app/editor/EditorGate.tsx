import type { ReactNode } from "react";
import { headers } from "next/headers";
import {
  canEditRequestHeaders,
  canUseStagingLoginHeaders,
} from "../../lib/editor-auth";

function PrivateEditorNotice({
  canUseStagingLogin,
  failed,
}: {
  canUseStagingLogin: boolean;
  failed: boolean;
}) {
  return (
    <main className="article-shell privacy-shell">
      <section className="privacy-hero">
        {canUseStagingLogin ? (
          <>
            <p className="eyebrow">Staging editor</p>
            <h1>Old Sea Dogs editor login</h1>
            <p>Enter the staging editor password to continue.</p>
            <form className="staging-login-form" method="post" action="/api/editor/staging-login">
              <label>
                Staging editor password
                <input
                  autoComplete="current-password"
                  name="password"
                  required
                  type="password"
                />
              </label>
              {failed ? (
                <p className="form-error">That password was not accepted. Please try again.</p>
              ) : null}
              <button type="submit">Open editor</button>
            </form>
          </>
        ) : (
          <>
            <p className="eyebrow">Private editor</p>
            <h1>Old Sea Dogs editor access is restricted</h1>
            <p>
              This area is for approved Old Sea Dogs editors only. Public readers
              should use the main site navigation.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export async function EditorGate({
  children,
  failed = false,
}: {
  children: ReactNode;
  failed?: boolean;
}) {
  const requestHeaders = await headers();

  if (!await canEditRequestHeaders(requestHeaders)) {
    return (
      <PrivateEditorNotice
        canUseStagingLogin={canUseStagingLoginHeaders(requestHeaders)}
        failed={failed}
      />
    );
  }

  return <>{children}</>;
}
