import { describe, it, expect } from "vitest"
import { slugify, toPascal, toCamel } from "../lib/idHelpers.mjs"

describe("slugify", () => {
    it("converts a display name to kebab-case", () => {
        expect(slugify("My Cool Skin")).toBe("my-cool-skin")
    })

    it("strips special characters", () => {
        expect(slugify("Skin #2 (Beta)!")).toBe("skin-2-beta")
    })

    it("collapses multiple spaces and dashes", () => {
        expect(slugify("  a   b--c  ")).toBe("a-b-c")
    })

    it("handles a single word", () => {
        expect(slugify("Neon")).toBe("neon")
    })

    it("handles already-slugified input", () => {
        expect(slugify("already-a-slug")).toBe("already-a-slug")
    })

    it("returns empty string for blank input", () => {
        expect(slugify("   ")).toBe("")
    })
})

describe("toPascal", () => {
    it("converts kebab-case to PascalCase", () => {
        expect(toPascal("my-cool-skin")).toBe("MyCoolSkin")
    })

    it("handles a single segment", () => {
        expect(toPascal("neon")).toBe("Neon")
    })

    it("handles multiple dashes", () => {
        expect(toPascal("a-b-c-d")).toBe("ABCD")
    })
})

describe("toCamel", () => {
    it("converts kebab-case to camelCase", () => {
        expect(toCamel("my-cool-skin")).toBe("myCoolSkin")
    })

    it("handles a single segment", () => {
        expect(toCamel("neon")).toBe("neon")
    })

    it("handles multiple dashes", () => {
        expect(toCamel("a-b-c-d")).toBe("aBCD")
    })
})
