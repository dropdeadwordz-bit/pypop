import { useEffect, useState } from "react";
import { useStore, ACCENTS } from "./lib/store.js";
import { lessonById, ALL_LESSONS } from "./lib/content.js";
import { useToasts } from "./lib/toast.js";
import Home from "./screens/Home.jsx";
import Lesson from "./screens/Lesson.jsx";
import Complete from "./screens/Complete.jsx";
import AlbumOpen from "./screens/AlbumOpen.jsx";
import Collection from "./screens/Collection.jsx";
import Profile from "./screens/Profile.jsx";
import Playground from "./screens/Playground.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import { IconLearn, IconCode, IconCards, IconUser } from "./components/Icons.jsx";

function applyAccent(key) {
  const a = ACCENTS[key] || ACCENTS.pink;
  const r = document.documentElement.style;
  r.setProperty("--accent", a.main);
  r.setProperty("--accent-deep", a.deep);
  r.setProperty("--accent-soft", a.soft);
  r.setProperty("--accent-glow", a.glow);
  r.setProperty("--accent-ink", a.ink);
}

const TABS = [
  { id: "learn", label: "Lernen", Icon: IconLearn },
  { id: "play", label: "Spielwiese", Icon: IconCode },
  { id: "collection", label: "Sammlung", Icon: IconCards },
  { id: "profile", label: "Profil", Icon: IconUser },
];

function Toasts() {
  const list = useToasts();
  return (
    <div className="toasts" aria-live="polite">
      {list.map((t) => (
        <div className="toast" key={t.id}>
          <span aria-hidden="true">{t.icon}</span> {t.text}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const s = useStore();
  const [tab, setTab] = useState("learn");
  const [overlay, setOverlay] = useState(null);

  useEffect(() => applyAccent(s.accent), [s.accent]);
  useEffect(() => {
    document.body.classList.toggle("has-overlay", !!overlay);
  }, [overlay]);

  if (!s.onboarded) {
    return (
      <>
        <Onboarding name={s.name} onAccent={applyAccent} onDone={() => setOverlay({ type: "lesson", id: ALL_LESSONS[0].id })} />
        <Toasts />
      </>
    );
  }

  const lesson = overlay?.type === "lesson" ? lessonById(overlay.id) : null;
  const openAlbum = () => setOverlay({ type: "album" });

  return (
    <div className="app">
      <main className="screen" hidden={!!overlay} aria-hidden={!!overlay}>
        {tab === "learn" && <Home onLesson={(id) => setOverlay({ type: "lesson", id })} onAlbum={openAlbum} />}
        {tab === "play" && <Playground />}
        {tab === "collection" && <Collection onAlbum={openAlbum} />}
        {tab === "profile" && <Profile />}
      </main>
      {!overlay && (
        <nav className="tabbar" aria-label="Hauptmenü">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} className={"tab" + (tab === id ? " on" : "")} aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); window.scrollTo(0, 0); }}>
              <span className="tab-icon"><Icon /></span>
              <span className="tab-label">{label}</span>
            </button>
          ))}
        </nav>
      )}

      {lesson && (
        <Lesson
          key={overlay.id + (overlay.n || 0)}
          lesson={lesson}
          onExit={() => setOverlay(null)}
          onDone={(summary) => setOverlay({ type: "complete", summary })}
        />
      )}
      {overlay?.type === "complete" && (
        <Complete
          summary={overlay.summary}
          onClose={() => { setOverlay(null); setTab("learn"); }}
          onAlbum={openAlbum}
        />
      )}
      {overlay?.type === "album" && (
        <AlbumOpen onClose={() => setOverlay(null)} onCollection={() => { setOverlay(null); setTab("collection"); }} />
      )}
      <Toasts />
    </div>
  );
}

