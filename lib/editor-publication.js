function payloadError(payload, fallback) {
  return payload && typeof payload === "object" && typeof payload.error === "string"
    ? payload.error
    : fallback;
}

async function readPayload(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * One client request path for Bridge and Classic Editor story saves.
 * Publication first persists current rights metadata to the referenced media
 * record, then asks the server to validate and save the story.
 */
export async function saveEditorStoryRequest({ story, mediaRightsUpdates = [], fetcher = fetch }) {
  const persistedMedia = [];
  const mediaPersistenceWarnings = [];

  for (const update of mediaRightsUpdates) {
      if (!update?.id) continue;
      const mediaResponse = await fetcher("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "updateMedia", id: update.id, media: update.media || {} }),
      });
      const mediaPayload = await readPayload(mediaResponse);
      if (!mediaResponse.ok) {
        mediaPersistenceWarnings.push(payloadError(mediaPayload, `Could not save image rights details for ${update.id}; publication continued.`));
        continue;
      }
      persistedMedia.push(mediaPayload.media);
    }

  const response = await fetcher("/api/editor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "saveStory", story }),
  });
  const payload = await readPayload(response);
  return { response, payload, persistedMedia, mediaPersistenceWarnings };
}
