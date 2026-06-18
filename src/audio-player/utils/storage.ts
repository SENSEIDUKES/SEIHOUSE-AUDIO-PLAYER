import { useState, useEffect, useCallback } from "react"

// A generic hook for local storage with debounce
export function useLocalStorage<T>(key: string, initialValue: T, debounceMs = 500): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue
        }
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error)
            return initialValue
        }
    })

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        setStoredValue((prev) => {
            const next = value instanceof Function ? value(prev) : value
            return next
        })
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return

        const handler = setTimeout(() => {
            try {
                window.localStorage.setItem(key, JSON.stringify(storedValue))
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error)
            }
        }, debounceMs)

        return () => clearTimeout(handler)
    }, [key, storedValue, debounceMs])

    return [storedValue, setValue]
}

export interface PlaybackState {
    trackId: string
    currentTime: number
}

const PLAYBACK_STATE_KEY = "ap-playback-state"

export function savePlaybackState(state: PlaybackState) {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(PLAYBACK_STATE_KEY, JSON.stringify(state))
    } catch (error) {
        console.warn(`Error saving playback state:`, error)
    }
}

export function loadPlaybackState(): PlaybackState | null {
    if (typeof window === "undefined") return null
    try {
        const item = window.localStorage.getItem(PLAYBACK_STATE_KEY)
        return item ? JSON.parse(item) : null
    } catch (error) {
        console.warn(`Error loading playback state:`, error)
        return null
    }
}

export function clearPlaybackState() {
    if (typeof window === "undefined") return
    try {
        window.localStorage.removeItem(PLAYBACK_STATE_KEY)
    } catch (error) {
        console.warn(`Error clearing playback state:`, error)
    }
}
