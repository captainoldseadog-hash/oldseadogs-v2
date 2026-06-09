"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StoryStatus = "draft" | "published";

type EditorStory = {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  sourceType: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCaption: string;
  summary: string;
  body: string[];
  tags: string[];
  readMinutes: number;
  isFeatured: boolean;
  status: StoryStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type MediaAsset = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  alt: string;
  createdAt: string;
};

type Advert = {
  id: string;
  placement: string;
  kind: string;
  label: string;
  title: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Settings = {
  brandName: string;
  kicker: string;
  footerText: string;
  siteDescription: string;
};

type EditorData = {
  stories: EditorStory[];
  media: MediaAsset[];
  ads: Advert[];
  settings: Settings;
  user: {
    email: string;
  };
};

const blankStory = (): EditorStory => ({
  id: "",
  slug: "",
  title: "",
  category: "News",
  date: new Date().toISOString().slice(0, 10),
  author: "Michael Hodges",
  sourceType: "Original",
  sourceName: "Old Sea Dogs desk",
  sourceUrl: "",
  imageUrl: "",
  imageAlt: "",
  imageCredit: "",
  imageCaption: "",
  summary: "",
  body: [""],
  tags: [],
  readMinutes: 3,
  isFeatured: false,
  status: "draft",
  sortOrder: 0,
  createdAt: "",
  updatedAt: "",
});

const blankAd = (): Advert => ({
  id: "",
  placement: "sidebar",
  kind: "manual",
  label: "Advert",
  title: "",
  body: "",
  imageUrl: "",
  linkUrl: "",
  code: "",
  isActive: true,
  createdAt: "",
  updatedAt: "",
});

const starterImages = [
  { url: "", label: "No photo" },
  { url: "/images/marina-hero.png", label: "Classic marina" },
  { url: "/images/racing-yachts.png", label: "Racing yachts" },
  { url: "/images/motor-yacht-review.png", label: "Motor yacht" },
  { url: "/images/boatyard-maintenance.png", label: "Boatyard" },
  { url: "/images/monaco-port-hercules-grand-prix.png", label: "Port Hercules, Monaco Grand Prix" },
];

export default function EditorDashboard() {
  const [data, setData] = useState<EditorData | null>(null);
  const [activeTab, setActiveTab] = useState<"stories" | "photos" | "ads" | "settings">("stories");
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  const [selectedAdId, setSelectedAdId] = useState<string>("");
  const [storyDraft, setStoryDraft] = useState<EditorStory>(blankStory);
  const [adDraft, setAdDraft] = useState<Advert>(blankAd);
  const [settingsDraft, setSettingsDraft] = useState<Settings | null>(null);
  const [photoAlt, setPhotoAlt] = useState("");
  const [storySearch, setStorySearch] = useState("");
  const [message, setMessage] = useState("Loading editor...");
  const [busy, setBusy] = useState(false);

  async function loadEditor() {
    setBusy(true);
    try {
      const response = await fetch("/api/editor", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load editor.");
      setData(payload);
      setSettingsDraft(payload.settings);
      const firstStory = payload.stories[0] ?? blankStory();
      setSelectedStoryId(firstStory.id);
      setStoryDraft(firstStory);
      const firstAd = payload.ads[0] ?? blankAd();
      setSelectedAdId(firstAd.id);
      setAdDraft(firstAd);
      setMessage("Ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load editor.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEditor();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const imageChoices = useMemo(
    () => [
      ...starterImages,
      ...(data?.media ?? []).map((asset) => ({
        url: asset.url,
        label: asset.alt || asset.filename,
      })),
    ],
    [data?.media]
  );

  const visibleStories = useMemo(() => {
    const stories = data?.stories ?? [];
    const query = storySearch.trim().toLowerCase();
    if (!query) return stories.slice(0, 200);
    return stories.filter((story) =>
      [
        story.title,
        story.category,
        story.date,
        story.author,
        story.sourceName,
        story.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [data?.stories, storySearch]);

  function pickStory(story: EditorStory) {
    setSelectedStoryId(story.id);
    setStoryDraft(story);
    setActiveTab("stories");
  }

  function newStory() {
    const fresh = blankStory();
    setSelectedStoryId("");
    setStoryDraft(fresh);
    setActiveTab("stories");
    setMessage("New story ready.");
  }

  function pickAd(ad: Advert) {
    setSelectedAdId(ad.id);
    setAdDraft(ad);
    setActiveTab("ads");
  }

  function newAd() {
    setSelectedAdId("");
    setAdDraft(blankAd());
    setActiveTab("ads");
    setMessage("New advert ready.");
  }

  function addMediaToGallery(media: MediaAsset) {
    setData((current) =>
      current
        ? {
            ...current,
            media: [media, ...current.media.filter((asset) => asset.id !== media.id)],
          }
        : current
    );
  }

  function showStoryPhoto(imageUrl: string, imageAlt: string, storyId = storyDraft.id) {
    setStoryDraft((story) => ({
      ...story,
      imageUrl,
      imageAlt,
    }));
    setData((current) =>
      current
        ? {
            ...current,
            stories: current.stories.map((story) =>
              story.id === storyId ? { ...story, imageUrl, imageAlt } : story
            ),
          }
        : current
    );
  }

  async function saveCurrentStoryPhoto(imageUrl: string, imageAlt: string) {
    if (!storyDraft.id) {
      setMessage(imageUrl ? "Photo selected. Press Save story when the new story is ready." : "No photo selected. Press Save story when the new story is ready.");
      return;
    }

    const response = await fetch("/api/editor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "saveStory", story: { ...storyDraft, imageUrl, imageAlt } }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not save the photo to this story.");
    showStoryPhoto(payload.story.imageUrl, payload.story.imageAlt, payload.story.id);
    setMessage(payload.story.imageUrl ? "Photo saved to this story." : "This story now has no photo.");
  }

  async function chooseStoryPhoto(image: { url: string; label: string }) {
    const imageAlt = image.url ? image.label || storyDraft.imageAlt || "Old Sea Dogs story image" : "";
    setBusy(true);
    setMessage(image.url ? "Saving photo to this story..." : "Removing photo from this story...");
    try {
      showStoryPhoto(image.url, imageAlt);
      setActiveTab("stories");
      await saveCurrentStoryPhoto(image.url, imageAlt);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the photo to this story.");
    } finally {
      setBusy(false);
    }
  }

  async function saveStoryDraft() {
    setBusy(true);
    setMessage("Saving story...");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "saveStory", story: storyDraft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save story.");
      await loadEditor();
      setSelectedStoryId(payload.story.id);
      setStoryDraft(payload.story);
      setMessage(storyDraft.status === "published" ? "Story saved and published." : "Story saved as a draft.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save story.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrentStory() {
    if (!storyDraft.id || !confirm("Delete this story?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "deleteStory", id: storyDraft.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not delete story.");
      await loadEditor();
      setMessage("Story deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete story.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File, alt = "") {
    setBusy(true);
    setMessage("Uploading photo...");
    try {
      const form = new FormData();
      form.append("photo", file);
      form.append("alt", alt);
      const response = await fetch("/api/editor", {
        method: "POST",
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not upload photo.");
      const media = payload.media as MediaAsset;
      const imageAlt = media.alt || alt || media.filename || "Old Sea Dogs story image";
      addMediaToGallery(media);
      showStoryPhoto(media.url, imageAlt);
      setActiveTab("stories");
      await saveCurrentStoryPhoto(media.url, imageAlt);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not upload photo.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettingsDraft() {
    if (!settingsDraft) return;
    setBusy(true);
    setMessage("Saving site settings...");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "saveSettings", settings: settingsDraft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save settings.");
      setSettingsDraft(payload.settings);
      await loadEditor();
      setMessage("Site settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAdvert() {
    setBusy(true);
    setMessage("Saving advert...");
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "saveAd", ad: adDraft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save advert.");
      await loadEditor();
      setSelectedAdId(payload.ad.id);
      setAdDraft(payload.ad);
      setMessage("Advert saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save advert.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrentAd() {
    if (!adDraft.id || !confirm("Delete this advert?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/editor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "deleteAd", id: adDraft.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not delete advert.");
      await loadEditor();
      setMessage("Advert deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete advert.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="editor-shell">
      <header className="editor-topbar">
        <Link href="/" className="brand-lockup dark">
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs</span>
        </Link>
        <div className="editor-actions">
          <Link href="/" className="editor-link">View site</Link>
          <Link href="/#latest" className="editor-link">Latest stories</Link>
        </div>
      </header>

      <section className="editor-hero">
        <div>
          <p className="eyebrow">Private editor</p>
          <h1>Old Sea Dogs editor</h1>
          <p>Stories, photos, site words, and adverts.</p>
        </div>
        <aside className="editor-status">
          <strong>{busy ? "Working..." : "Status"}</strong>
          <span>{message}</span>
          {data?.user.email ? <small>Signed in as {data.user.email}</small> : null}
        </aside>
      </section>

      <nav className="editor-tabs" aria-label="Editor sections">
        <button className={activeTab === "stories" ? "active" : ""} onClick={() => setActiveTab("stories")}>Stories</button>
        <button className={activeTab === "photos" ? "active" : ""} onClick={() => setActiveTab("photos")}>Photos</button>
        <button className={activeTab === "ads" ? "active" : ""} onClick={() => setActiveTab("ads")}>Adverts</button>
        <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>Site words</button>
      </nav>

      {!data ? (
        <section className="editor-panel">
          <h2>Loading</h2>
          <p>{message}</p>
        </section>
      ) : null}

      {data && activeTab === "stories" ? (
        <section className="editor-grid">
          <aside className="editor-list">
            <div className="editor-list-header">
              <h2>Stories</h2>
              <button onClick={newStory}>New story</button>
            </div>
            <label className="editor-search">
              Search stories
              <input
                value={storySearch}
                placeholder="Headline, category, tag, date..."
                onChange={(event) => setStorySearch(event.target.value)}
              />
            </label>
            <p className="story-count">
              Showing {visibleStories.length} of {data.stories.length}
              {!storySearch ? " latest stories" : " matching stories"}
            </p>
            {visibleStories.map((story) => (
              <button
                key={story.id}
                className={selectedStoryId === story.id ? "selected" : ""}
                onClick={() => pickStory(story)}
              >
                <span>{story.title || "Untitled story"}</span>
                <small>{story.status === "published" ? "Published" : "Draft"} · {story.category}</small>
              </button>
            ))}
          </aside>

          <StoryForm
            story={storyDraft}
            setStory={setStoryDraft}
            images={imageChoices}
            onUpload={uploadPhoto}
            onChooseImage={chooseStoryPhoto}
            onSave={saveStoryDraft}
            onDelete={deleteCurrentStory}
            busy={busy}
          />
        </section>
      ) : null}

      {data && activeTab === "photos" ? (
        <section className="editor-panel">
          <div className="editor-list-header">
            <h2>Photos</h2>
          </div>
          <div className="upload-strip">
            <label>
              Photo description
              <input
                value={photoAlt}
                placeholder="Short description for readers and search"
                onChange={(event) => setPhotoAlt(event.target.value)}
              />
            </label>
            <label className="upload-button">
              Upload photo
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadPhoto(file, photoAlt);
                    event.currentTarget.value = "";
                  }
                }}
              />
            </label>
          </div>
          <div className="photo-grid">
            {imageChoices.map((image) => (
              <button
                key={image.url}
                onClick={() => void chooseStoryPhoto(image)}
              >
                <span style={{ backgroundImage: `url(${image.url})` }} />
                <strong>{image.label}</strong>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {data && activeTab === "ads" ? (
        <section className="editor-grid">
          <aside className="editor-list">
            <div className="editor-list-header">
              <h2>Adverts</h2>
              <button onClick={newAd}>New advert</button>
            </div>
            {data.ads.length === 0 ? <p>No adverts yet.</p> : null}
            {data.ads.map((ad) => (
              <button
                key={ad.id}
                className={selectedAdId === ad.id ? "selected" : ""}
                onClick={() => pickAd(ad)}
              >
                <span>{ad.label}</span>
                <small>{ad.isActive ? "Live" : "Paused"} · {ad.placement}</small>
              </button>
            ))}
          </aside>

          <AdForm
            ad={adDraft}
            setAd={setAdDraft}
            images={imageChoices}
            onSave={saveAdvert}
            onDelete={deleteCurrentAd}
            busy={busy}
          />
        </section>
      ) : null}

      {data && activeTab === "settings" && settingsDraft ? (
        <section className="editor-panel editor-form">
          <h2>Site words</h2>
          <label>
            Site name
            <input
              value={settingsDraft.brandName}
              onChange={(event) => setSettingsDraft({ ...settingsDraft, brandName: event.target.value })}
            />
          </label>
          <label>
            Short line above the homepage title
            <input
              value={settingsDraft.kicker}
              onChange={(event) => setSettingsDraft({ ...settingsDraft, kicker: event.target.value })}
            />
          </label>
          <label>
            Footer sentence
            <textarea
              value={settingsDraft.footerText}
              onChange={(event) => setSettingsDraft({ ...settingsDraft, footerText: event.target.value })}
            />
          </label>
          <label>
            Search description
            <textarea
              value={settingsDraft.siteDescription}
              onChange={(event) => setSettingsDraft({ ...settingsDraft, siteDescription: event.target.value })}
            />
          </label>
          <div className="form-actions">
            <button onClick={saveSettingsDraft} disabled={busy}>Save site words</button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function StoryForm({
  story,
  setStory,
  images,
  onUpload,
  onChooseImage,
  onSave,
  onDelete,
  busy,
}: {
  story: EditorStory;
  setStory: (story: EditorStory | ((story: EditorStory) => EditorStory)) => void;
  images: Array<{ url: string; label: string }>;
  onUpload: (file: File, alt?: string) => Promise<void>;
  onChooseImage: (image: { url: string; label: string }) => Promise<void>;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  busy: boolean;
}) {
  const bodyText = story.body.join("\n\n");
  const tagText = story.tags.join(", ");

  return (
    <section className="editor-panel editor-form">
      <div className="form-head">
        <div>
          <p className="eyebrow">{story.id ? "Edit story" : "New story"}</p>
          <h2>{story.title || "Untitled story"}</h2>
        </div>
        <span className={story.status === "published" ? "pill live" : "pill"}>{story.status}</span>
      </div>

      <div className="split-fields">
        <label>
          Headline
          <input value={story.title} onChange={(event) => setStory({ ...story, title: event.target.value })} />
        </label>
        <label>
          Category
          <select value={story.category} onChange={(event) => setStory({ ...story, category: event.target.value })}>
            <option>News</option>
            <option>Boat Reviews</option>
            <option>Cruising</option>
            <option>Maintenance</option>
            <option>Regatta</option>
            <option>Shows</option>
            <option>Racing</option>
            <option>Gear</option>
            <option>Destinations</option>
            <option>Masterclass</option>
            <option>Lifestyle</option>
            <option>Clubs</option>
            <option>Ports</option>
          </select>
        </label>
      </div>

      <label>
        Page address
        <div className="address-field">
          <span>/stories/</span>
          <input
            value={story.slug}
            placeholder="filled from headline when blank"
            onChange={(event) => setStory({ ...story, slug: event.target.value })}
          />
        </div>
      </label>

      <label>
        Short summary for cards and the top story
        <textarea value={story.summary} onChange={(event) => setStory({ ...story, summary: event.target.value })} />
      </label>

      <label>
        Article text
        <textarea
          className="story-body-box"
          value={bodyText}
          onChange={(event) =>
            setStory({
              ...story,
              body: event.target.value
                .split(/\n{2,}/)
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
        />
        <small>Tip: leave a blank line between paragraphs.</small>
      </label>

      <div className="split-fields">
        <label>
          Publish date
          <input type="date" value={story.date} onChange={(event) => setStory({ ...story, date: event.target.value })} />
        </label>
        <label>
          Author
          <input value={story.author} onChange={(event) => setStory({ ...story, author: event.target.value })} />
        </label>
      </div>

      <div className="split-fields">
        <label>
          Source type
          <select value={story.sourceType} onChange={(event) => setStory({ ...story, sourceType: event.target.value })}>
            <option>Original</option>
            <option>Press release</option>
            <option>Automatic watch</option>
          </select>
        </label>
        <label>
          Source name
          <input value={story.sourceName} onChange={(event) => setStory({ ...story, sourceName: event.target.value })} />
        </label>
      </div>

      <label>
        Source link
        <input
          value={story.sourceUrl}
          placeholder="Optional link to a press release or source"
          onChange={(event) => setStory({ ...story, sourceUrl: event.target.value })}
        />
      </label>

      <div className="split-fields">
        <label>
          Tags
          <input value={tagText} onChange={(event) => setStory({ ...story, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
        </label>
        <label>
          Reading time
          <input
            type="number"
            min="1"
            value={story.readMinutes}
            onChange={(event) => setStory({ ...story, readMinutes: Number(event.target.value || 1) })}
          />
        </label>
      </div>

      <div className="image-picker">
        <div
          className={`picked-image ${story.imageUrl ? "" : "no-picked-image"}`}
          style={story.imageUrl ? { backgroundImage: `url(${story.imageUrl})` } : undefined}
          role="img"
          aria-label={story.imageAlt || "Selected story image"}
        >
          {!story.imageUrl ? <span>No photo</span> : null}
        </div>
        <div className="image-controls">
          <label>
            Story photo
            <select
              value={story.imageUrl}
              onChange={(event) => {
                const chosen = images.find((image) => image.url === event.target.value);
                void onChooseImage({
                  url: event.target.value,
                  label: chosen?.label || story.imageAlt,
                });
              }}
            >
              {images.map((image) => (
                <option key={image.url} value={image.url}>{image.label}</option>
              ))}
            </select>
          </label>
          <label>
            Photo description
            <input value={story.imageAlt} onChange={(event) => setStory({ ...story, imageAlt: event.target.value })} />
          </label>
          <label>
            Photo caption
            <input value={story.imageCaption} onChange={(event) => setStory({ ...story, imageCaption: event.target.value })} />
          </label>
          <label>
            Photo credit
            <input
              value={story.imageCredit}
              placeholder="Example: © Michael Hodges"
              onChange={(event) => setStory({ ...story, imageCredit: event.target.value })}
            />
          </label>
          <label className="upload-button">
            Upload new photo
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void onUpload(file, story.imageAlt);
                  event.currentTarget.value = "";
                }
              }}
            />
          </label>
        </div>
      </div>

      <div className="publish-row">
        <label className="check-row">
          <input type="checkbox" checked={story.isFeatured} onChange={(event) => setStory({ ...story, isFeatured: event.target.checked })} />
          Make this the main homepage story
        </label>
        <label>
          Status
          <select value={story.status} onChange={(event) => setStory({ ...story, status: event.target.value as StoryStatus })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>

      <div className="form-actions">
        <button onClick={onSave} disabled={busy}>Save story</button>
        {story.slug ? (
          <Link className="quiet-link" href={`/stories/${story.slug}`}>
            View page
          </Link>
        ) : null}
        <button className="quiet-button" onClick={onDelete} disabled={busy || !story.id}>Delete</button>
      </div>
    </section>
  );
}

function AdForm({
  ad,
  setAd,
  images,
  onSave,
  onDelete,
  busy,
}: {
  ad: Advert;
  setAd: (ad: Advert) => void;
  images: Array<{ url: string; label: string }>;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  busy: boolean;
}) {
  return (
    <section className="editor-panel editor-form">
      <div className="form-head">
        <div>
          <p className="eyebrow">{ad.id ? "Edit advert" : "New advert"}</p>
          <h2>{ad.label || "Advert"}</h2>
        </div>
        <span className={ad.isActive ? "pill live" : "pill"}>{ad.isActive ? "Live" : "Paused"}</span>
      </div>

      <div className="split-fields">
        <label>
          Advert name
          <input value={ad.label} onChange={(event) => setAd({ ...ad, label: event.target.value })} />
        </label>
        <label>
          Position
          <select value={ad.placement} onChange={(event) => setAd({ ...ad, placement: event.target.value })}>
            <option value="sidebar">Sidebar</option>
            <option value="banner">Wide banner</option>
          </select>
        </label>
      </div>

      <label>
        Advert type
        <select value={ad.kind} onChange={(event) => setAd({ ...ad, kind: event.target.value })}>
          <option value="manual">Manual advert</option>
          <option value="network">Google or advert network</option>
        </select>
      </label>

      {ad.kind === "manual" ? (
        <>
          <label>
            Advert headline
            <input value={ad.title} onChange={(event) => setAd({ ...ad, title: event.target.value })} />
          </label>
          <label>
            Advert text
            <textarea value={ad.body} onChange={(event) => setAd({ ...ad, body: event.target.value })} />
          </label>
          <div className="split-fields">
            <label>
              Advert image
              <select value={ad.imageUrl} onChange={(event) => setAd({ ...ad, imageUrl: event.target.value })}>
                <option value="">No image</option>
                {images.map((image) => (
                  <option key={image.url} value={image.url}>{image.label}</option>
                ))}
              </select>
            </label>
            <label>
              Link
              <input value={ad.linkUrl} onChange={(event) => setAd({ ...ad, linkUrl: event.target.value })} />
            </label>
          </div>
        </>
      ) : (
        <label>
          Paste the advert code from Google or another provider
          <textarea
            className="story-body-box"
            value={ad.code}
            onChange={(event) => setAd({ ...ad, code: event.target.value })}
          />
        </label>
      )}

      <label className="check-row">
        <input type="checkbox" checked={ad.isActive} onChange={(event) => setAd({ ...ad, isActive: event.target.checked })} />
        Show this advert on the site
      </label>

      <div className="form-actions">
        <button onClick={onSave} disabled={busy}>Save advert</button>
        <button className="quiet-button" onClick={onDelete} disabled={busy || !ad.id}>Delete</button>
      </div>
    </section>
  );
}
