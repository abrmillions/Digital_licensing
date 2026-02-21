export function downloadPDF(pdf: any, filename: string) {
  const blob: Blob = pdf.output("blob")
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  const isIOS = typeof navigator !== "undefined" && /iP(ad|hone|od)/.test(navigator.userAgent)
  const supportsDownload = "download" in a
  try {
    const navAny = navigator as any
    if (navAny && typeof navAny.share === "function" && typeof navAny.canShare === "function") {
      const file = new File([blob], filename, { type: "application/pdf" })
      if (navAny.canShare({ files: [file] })) {
        navAny.share({ files: [file], title: filename }).catch(() => {})
        setTimeout(() => URL.revokeObjectURL(url), 5000)
        return
      }
    }
  } catch {}
  document.body.appendChild(a)
  if (supportsDownload && !isIOS) {
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return
  }
  a.target = "_blank"
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadFromUrl(url: string, filename: string) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    downloadFile(blob, filename)
  } catch (error) {
    console.error("Error downloading file:", error)
    throw error
  }
}
