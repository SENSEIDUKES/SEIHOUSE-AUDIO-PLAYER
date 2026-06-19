import { afterEach, describe, expect, it } from "vitest"
import {
    VAULT_CATEGORY_META,
    clearCustomCategories,
    getAllVaultCategories,
    getVaultCategoryMeta,
    registerVaultCategory,
} from "../vaultCategories"

// The registry is module-scoped; clear custom entries between tests so neither
// order nor future exact-count assertions can leak state.
afterEach(() => clearCustomCategories())

describe("vault category lookup", () => {
    it("resolves a built-in category", () => {
        expect(getVaultCategoryMeta("beat")).toEqual({ label: "Beat", color: "#22D3A6" })
    })

    it("returns null for undefined", () => {
        expect(getVaultCategoryMeta(undefined)).toBeNull()
    })

    it("returns null for an unknown string", () => {
        expect(getVaultCategoryMeta("not-a-category")).toBeNull()
    })

    it("returns null for inherited prototype keys (no prototype lookup bug)", () => {
        // Field is widened to any string; these must not resolve to
        // Object/Function.prototype members.
        expect(getVaultCategoryMeta("toString")).toBeNull()
        expect(getVaultCategoryMeta("constructor")).toBeNull()
        expect(getVaultCategoryMeta("hasOwnProperty")).toBeNull()
        expect(getVaultCategoryMeta("__proto__")).toBeNull()
    })
})

describe("custom category registry", () => {
    it("resolves a registered custom category and lists it", () => {
        registerVaultCategory("liveTake", { label: "Live Take", color: "#E879F9" })
        expect(getVaultCategoryMeta("liveTake")).toEqual({
            label: "Live Take",
            color: "#E879F9",
        })
        const all = getAllVaultCategories()
        const ids = all.map(([id]) => id)
        // built-ins still present
        expect(ids).toEqual(expect.arrayContaining(Object.keys(VAULT_CATEGORY_META)))
        // custom appended
        expect(ids).toContain("liveTake")
    })

    it("lets a custom registration override a built-in id", () => {
        registerVaultCategory("memo", { label: "Voice Memo", color: "#123456" })
        expect(getVaultCategoryMeta("memo")).toEqual({
            label: "Voice Memo",
            color: "#123456",
        })
        // getAllVaultCategories collapses the override to a single entry
        const memoEntries = getAllVaultCategories().filter(([id]) => id === "memo")
        expect(memoEntries).toHaveLength(1)
        expect(memoEntries[0][1].label).toBe("Voice Memo")
    })
})
