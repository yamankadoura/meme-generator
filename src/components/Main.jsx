import { useEffect, useMemo, useState } from "react"

const DEFAULT_IMAGE_URL = "https://i.imgflip.com/1bij.jpg"

function drawMemeText(ctx, text, x, y, maxWidth, lineHeight, fromBottom = false) {
    const words = text.trim().split(/\s+/)
    if (!text.trim() || words.length === 0) return

    const lines = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i += 1) {
        const candidate = `${currentLine} ${words[i]}`
        if (ctx.measureText(candidate).width <= maxWidth) {
            currentLine = candidate
        } else {
            lines.push(currentLine)
            currentLine = words[i]
        }
    }
    lines.push(currentLine)

    if (fromBottom) {
        for (let i = lines.length - 1; i >= 0; i -= 1) {
            const lineY = y - (lines.length - 1 - i) * lineHeight
            ctx.strokeText(lines[i], x, lineY)
            ctx.fillText(lines[i], x, lineY)
        }
        return
    }

    lines.forEach((line, index) => {
        const lineY = y + index * lineHeight
        ctx.strokeText(line, x, lineY)
        ctx.fillText(line, x, lineY)
    })
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = "anonymous"
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error("Failed to load image"))
        image.src = url
    })
}

export default function Main() {
    const [meme, setMeme] = useState({
        topText: "",
        bottomText: "",
        imageUrl: DEFAULT_IMAGE_URL,
        imageName: "Classic Meme"
    })

    const [arrMeme, setArrMeme] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDownloading, setIsDownloading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        let isMounted = true

        async function getMemes() {
            setIsLoading(true)
            setError("")

            try {
                const response = await fetch("https://api.imgflip.com/get_memes")
                if (!response.ok) {
                    throw new Error("Template request failed")
                }

                const data = await response.json()
                const memes = data?.data?.memes ?? []

                if (!isMounted) return

                setArrMeme(memes)
            } catch (requestError) {
                if (!isMounted) return
                setError("Could not load meme templates. Please try again.")
                console.error(requestError)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        getMemes()

        return () => {
            isMounted = false
        }
    }, [])

    function getRandomImg() {
        if (arrMeme.length === 0) return

        const randomIndex = Math.floor(Math.random() * arrMeme.length)
        const selectedMeme = arrMeme[randomIndex]

        setMeme(prevMeme => ({
            ...prevMeme,
            imageUrl: selectedMeme.url,
            imageName: selectedMeme.name
        }))
        setError("")
    }

    function handleChange(event) {
        const { value, name } = event.currentTarget
        setMeme(prevMeme => ({
            ...prevMeme,
            [name]: value
        }))
    }

    async function handleDownload() {
        setIsDownloading(true)
        setError("")

        try {
            const image = await loadImage(meme.imageUrl)
            const canvas = document.createElement("canvas")
            canvas.width = image.naturalWidth
            canvas.height = image.naturalHeight

            const ctx = canvas.getContext("2d")
            if (!ctx) {
                throw new Error("Canvas context is unavailable")
            }

            ctx.drawImage(image, 0, 0)

            const fontSize = Math.max(canvas.width * 0.07, 32)
            const lineHeight = fontSize * 1.1

            ctx.font = `900 ${fontSize}px Impact, Arial Black, sans-serif`
            ctx.textAlign = "center"
            ctx.fillStyle = "#ffffff"
            ctx.strokeStyle = "#000000"
            ctx.lineWidth = Math.max(4, Math.floor(fontSize / 10))

            drawMemeText(ctx, meme.topText, canvas.width / 2, lineHeight + 8, canvas.width * 0.9, lineHeight)
            drawMemeText(
                ctx,
                meme.bottomText,
                canvas.width / 2,
                canvas.height - 16,
                canvas.width * 0.9,
                lineHeight,
                true
            )

            const link = document.createElement("a")
            link.download = `${meme.imageName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "meme"}.png`
            link.href = canvas.toDataURL("image/png")
            link.click()
        } catch (downloadError) {
            setError("Could not export this image due to browser security restrictions on that source.")
            console.error(downloadError)
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <main className="main-shell">
            <section className="panel">
                <div className="panel-heading">
                    <h2>Design Your Meme</h2>
                </div>

                <div className="form">
                    <label htmlFor="topText">Top Text
                    <input
                        id="topText"
                        type="text"
                        placeholder="One does not simply"
                        name="topText"
                        onChange={handleChange}
                        value={meme.topText}
                    />
                </label>

                <label htmlFor="bottomText">Bottom Text
                    <input
                        id="bottomText"
                        type="text"
                        placeholder="Walk into Mordor"
                        name="bottomText"
                        onChange={handleChange}
                        value={meme.bottomText}
                    />
                </label>

                    <div className="actions">
                        <button type="button" onClick={getRandomImg} disabled={isLoading || arrMeme.length === 0}>
                            {isLoading ? "Loading..." : "New Template"}
                        </button>
                        <button
                            type="button"
                            className="secondary"
                            onClick={handleDownload}
                            disabled={isDownloading}
                        >
                            {isDownloading ? "Preparing PNG..." : "Download PNG"}
                        </button>
                    </div>

                    {error && <p className="error-text" role="alert">{error}</p>}
                </div>
            </section>

            <section className="meme-card" aria-label="Meme preview">
                <div className="meme">
                    <img src={meme.imageUrl} alt={meme.imageName} />
                    <span className="top">{meme.topText}</span>
                    <span className="bottom">{meme.bottomText}</span>
                </div>
            </section>
        </main>
    )
}