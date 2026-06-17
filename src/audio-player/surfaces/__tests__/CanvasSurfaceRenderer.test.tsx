import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { CanvasSurfaceRenderer } from "../CanvasSurfaceRenderer"

describe("CanvasSurfaceRenderer", () => {
    it("renders lyrics lines when lyrics are available", () => {
        const html = renderToStaticMarkup(
            <CanvasSurfaceRenderer
                surfaceId="lyrics"
                lyrics={"[00:01.00] first line\n[00:02.00] second line"}
            />
        )
        expect(html).toContain("first line")
        expect(html).toContain("second line")
        // LRC timestamps are stripped by the parser.
        expect(html).not.toContain("[00:01")
    })

    it("shows the empty state when lyrics are missing", () => {
        const html = renderToStaticMarkup(
            <CanvasSurfaceRenderer surfaceId="lyrics" />
        )
        expect(html).toContain("Lyrics are not available for this track.")
    })

    it("renders a generic empty state for an unknown surface", () => {
        const html = renderToStaticMarkup(
            <CanvasSurfaceRenderer surfaceId="not-a-real-surface" />
        )
        expect(html).toContain("not available yet")
    })
})
