import { useEffect, useState } from "react"

/**
 * Extracts the average RGB color from an image URL using a hidden canvas.
 * Falls back to null if the image fails to load or CORS prevents extraction.
 */
export function useArtworkColor(src: string | undefined): string | null {
    const [color, setColor] = useState<string | null>(null)

    useEffect(() => {
        if (!src) {
            setColor(null)
            return
        }

        let isMounted = true

        const img = new Image()
        // Important for extracting cross-origin image data without tainting the canvas
        img.crossOrigin = "Anonymous"

        img.onload = () => {
            if (!isMounted) return

            try {
                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d")
                if (!ctx) return

                // Downscale for performance
                canvas.width = 64
                canvas.height = 64

                ctx.drawImage(img, 0, 0, 64, 64)
                const imageData = ctx.getImageData(0, 0, 64, 64).data

                let r = 0,
                    g = 0,
                    b = 0

                for (let i = 0; i < imageData.length; i += 4) {
                    r += imageData[i]
                    g += imageData[i + 1]
                    b += imageData[i + 2]
                }

                const pixelCount = imageData.length / 4
                setColor(
                    `rgb(${Math.round(r / pixelCount)}, ${Math.round(g / pixelCount)}, ${Math.round(b / pixelCount)})`
                )
            } catch (err) {
                // Ignore CORS errors (canvas tainted)
                console.warn("[useArtworkColor] Could not extract color:", err)
                if (isMounted) setColor(null)
            }
        }

        img.onerror = () => {
            if (isMounted) setColor(null)
        }

        img.src = src

        return () => {
            isMounted = false
            img.onload = null
            img.onerror = null
        }
    }, [src])

    return color
}
