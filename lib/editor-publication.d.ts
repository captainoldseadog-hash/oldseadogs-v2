export type EditorMediaRightsUpdate = {
  id: string;
  media: Record<string, unknown>;
};

export type EditorStorySaveInput<TStory> = {
  story: TStory;
  mediaRightsUpdates?: EditorMediaRightsUpdate[];
  fetcher?: typeof fetch;
};

export function saveEditorStoryRequest<TPayload = Record<string, unknown>, TStory = Record<string, unknown>>(
  input: EditorStorySaveInput<TStory>,
): Promise<{
  response: Response;
  payload: TPayload;
  persistedMedia: unknown[];
  mediaPersistenceWarnings: string[];
}>;
