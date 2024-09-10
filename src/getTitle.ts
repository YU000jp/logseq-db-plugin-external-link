export const getTitleFromURL = async (url: string): Promise<string> => {
    try {
        // URLがhttps://github.com/で始まる場合はフェッチせずにタイトルを返す fetchできないため
        if (url.startsWith("https://github.com/")) {
            const title = url.substring("https://github.com/".length)
            console.log("GitHub URL detected, title: ", title)
            return title
        }
        console.log("fetch: ", url)
        const res = await fetch(url) as Response
        if (!res.ok) return ''

        // Content-Typeが"text/html"であるかを確認
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("text/html")) {
            console.log("Not an HTML response")
            return ''
        }

        const { charset, title } = getEncodingConfigAndTitleFromHTML(await res.arrayBuffer() as ArrayBuffer)
        if (title) {
            console.log("Get title: ", title)
            return title
        }
    } catch (e) {
        console.error(e)
    }
    return ''
}


interface EncodingAndTitle {
    charset: string
    title: string | null
}

const decodeHtmlEntities = (text: string): string => {
    const tempElement = document.createElement('textarea')
    tempElement.innerHTML = text
    return tempElement.value
}

const getEncodingConfigAndTitleFromHTML = (buffer: ArrayBuffer): EncodingAndTitle => {
    const initialChunk = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 2048))
    let htmlString = new TextDecoder('utf-8').decode(initialChunk)

    let charsetMatch = htmlString.match(/<meta\s+charset=["']?([^"']+)["']?/i)
    let charset = charsetMatch ? charsetMatch[1] : null

    if (!charset) {
        const contentTypeMatch = htmlString.match(/<meta\s+http-equiv=["']content-type["'][^>]*content=["']?[^;]+;\s*charset=([^"']+)["']?/i)
        charset = contentTypeMatch ? contentTypeMatch[1] : 'UTF-8'
    }

    let title: string | null = null
    if (charset.toLowerCase() === 'utf-8') {
        const titleMatch = htmlString.match(/<title>(.*?)<\/title>/i)
        if (titleMatch)
            title = decodeHtmlEntities(titleMatch[1].trim())
    } else {
        const titleTagPosition = htmlString.indexOf('<title>')
        if (titleTagPosition !== -1) {
            const endPosition = Math.min(buffer.byteLength, titleTagPosition + 2048)
            const titleChunk = new Uint8Array(buffer.slice(titleTagPosition, endPosition))
            htmlString = new TextDecoder(charset).decode(titleChunk)
            const titleMatch = htmlString.match(/<title>(.*?)<\/title>/i)
            if (titleMatch)
                title = decodeHtmlEntities(titleMatch[1].trim())
        }
    }

    return {
        charset: charset ?? 'UTF-8',
        title
    }
}