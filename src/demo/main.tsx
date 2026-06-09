import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AudioPlayer } from "../audio-player"
import type { Track } from "../audio-player"

const SAMPLE =
    "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3"

// All three share the same SAMPLE URL to validate the sourceKey fix:
// switching between First Light → Midnight Run → Aurora must reset
// currentTime, duration, and buffered even though the src is unchanged.
const playlist: Track[] = [
    { id: "track-1", title: "First Light", artist: "SEIHouse", audioFile: SAMPLE, lyrics: "Verse one\nVerse two" },
    { id: "track-2", title: "Midnight Run", artist: "SEIHouse", audioFile: SAMPLE },
    { id: "track-3", title: "Aurora", artist: "SEIHouse", audioFile: SAMPLE },
    { id: "track-4", title: "Broken Source", artist: "SEIHouse", audioFile: "https://example.com/does-not-exist.mp3" },
]

function Demo() {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 24,
                padding: 24,
                maxWidth: 1100,
                margin: "0 auto",
            }}
        >
            <section>
                <h2 style={{ color: "#fff", fontFamily: "system-ui" }}>Single track</h2>
                <div style={{ height: 280 }}>
                    <AudioPlayer
                        title="Solo Track"
                        artist="SEIHouse"
                        audioFile={SAMPLE}
                        accentColor="#7C5CFF"
                        progressColor="#7C5CFF"
                        backgroundColor="rgba(20,20,28,0.6)"
                        lyrics={"Verse one\nVerse two\nChorus"}
                        purchaseUrl="https://example.com"
                    />
                </div>
            </section>

            <section>
                <h2 style={{ color: "#fff", fontFamily: "system-ui" }}>Playlist</h2>
                <div style={{ height: 520 }}>
                    <AudioPlayer
                        tracks={playlist}
                        showTracklist
                        accentColor="#22D3A6"
                        progressColor="#22D3A6"
                        backgroundColor="rgba(20,28,24,0.6)"
                    />
                </div>
            </section>
        </div>
    )
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Demo />
    </StrictMode>
)
