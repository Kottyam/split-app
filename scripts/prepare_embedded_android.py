from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "android-app/app/src/main/java/app/kharcha/splitter/MainActivity.java"
ASSETS = ROOT / "android-app/app/src/main/assets/web"

source = MAIN.read_text(encoding="utf-8")

old_load = "        webView.loadUrl(APP_URL);"
new_load = "        loadEmbeddedWebApp();"
if old_load not in source:
    raise SystemExit("MainActivity launch call was not found; refusing to patch an unexpected file")
source = source.replace(old_load, new_load, 1)

load_marker = "    private View createLogoSplash() {"
load_methods = r'''    private void loadEmbeddedWebApp() {
        try (InputStream input = getAssets().open("web/index.html")) {
            java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            String html = new String(output.toByteArray(), java.nio.charset.StandardCharsets.UTF_8);
            String baseUrl = "https://" + APP_HOST + "/";
            webView.loadDataWithBaseURL(baseUrl, html, "text/html", "UTF-8", APP_URL);
        } catch (IOException error) {
            showNetworkError();
        }
    }

    private WebResourceResponse serveEmbeddedWebRequest(WebResourceRequest request) {
        if (request == null || !isInternalUrl(request.getUrl()) || !"GET".equalsIgnoreCase(request.getMethod())) return null;

        Uri uri = request.getUrl();
        String path = uri.getPath();
        if (path == null || path.isEmpty()) path = "/";

        // Keep the backend on the real HTTPS origin. Only the compiled web UI/static files are local.
        if (path.startsWith("/api/") || path.startsWith("/trpc/") || path.startsWith("/auth") || path.startsWith("/oauth")) {
            return null;
        }

        String assetPath = null;
        String mimeType = null;
        if (path.startsWith("/assets/")) {
            assetPath = "web" + path;
            String extension = "";
            int dot = path.lastIndexOf('.');
            if (dot >= 0 && dot + 1 < path.length()) extension = path.substring(dot + 1).toLowerCase(Locale.ROOT);
            mimeType = android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
            if (mimeType == null) mimeType = "application/octet-stream";
        } else if (path.equals("/favicon.ico") || path.equals("/manifest.webmanifest") || path.equals("/robots.txt")) {
            assetPath = "web" + path;
            mimeType = path.endsWith(".webmanifest") ? "application/manifest+json" : path.endsWith(".txt") ? "text/plain" : "image/x-icon";
        } else if (request.isForMainFrame() && (path.equals("/") || request.getRequestHeaders().getOrDefault("Accept", "").contains("text/html"))) {
            assetPath = "web/index.html";
            mimeType = "text/html";
        }

        if (assetPath == null) return null;
        try {
            InputStream data = getAssets().open(assetPath);
            String encoding = "text/html".equals(mimeType) || mimeType.startsWith("text/") || mimeType.contains("javascript") ? "UTF-8" : null;
            return new WebResourceResponse(mimeType, encoding, data);
        } catch (IOException ignored) {
            return null;
        }
    }

'''
if load_marker not in source:
    raise SystemExit("MainActivity createLogoSplash marker was not found")
source = source.replace(load_marker, load_methods + load_marker, 1)

client_marker = '''        @Override
        public void onPageFinished(WebView view, String url) {
            revealLandingPage();
        }
'''
client_replacement = '''        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            WebResourceResponse response = serveEmbeddedWebRequest(request);
            return response != null ? response : super.shouldInterceptRequest(view, request);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            revealLandingPage();
        }
'''
if client_marker not in source:
    raise SystemExit("MainActivity WebViewClient marker was not found")
source = source.replace(client_marker, client_replacement, 1)

MAIN.write_text(source, encoding="utf-8")

# The APK is built from the exact web bundle produced by this checkout.
# It is deliberately not committed because Vite output is generated content.
if not (ASSETS / "index.html").exists():
    raise SystemExit("Embedded web bundle is missing: android-app/app/src/main/assets/web/index.html")

print("Embedded Android WebView prepared successfully")
