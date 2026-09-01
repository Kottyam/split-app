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

# Make the embedded document the actual startup document. Do not navigate the WebView
# to the deployed site after loading the checked-in bundle; the deployed HTTPS origin
# is retained only as the document base/origin for API and cookie compatibility.
old_method = '''    private View createLogoSplash() {\n'''
load_methods = r'''    private boolean embeddedStartupRetryUsed = false;

    private void loadEmbeddedWebApp() {
        try (InputStream input = getAssets().open("web/index.html")) {
            java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            String html = new String(output.toByteArray(), java.nio.charset.StandardCharsets.UTF_8);
            String baseUrl = "https://" + APP_HOST + "/";
            webView.loadDataWithBaseURL(baseUrl, html, "text/html", "UTF-8", null);
        } catch (IOException error) {
            showNetworkError();
        }
    }

    private void verifyEmbeddedDomAndReveal() {
        if (webView == null) return;
        webView.evaluateJavascript(
                "(function(){try{return !!document.getElementById('root') && document.getElementById('root').children.length > 0;}catch(e){return false;}})();",
                value -> {
                    boolean hasRoot = "true".equals(value);
                    if (hasRoot) {
                        revealLandingPage();
                        return;
                    }
                    if (!embeddedStartupRetryUsed) {
                        embeddedStartupRetryUsed = true;
                        handler.postDelayed(this::loadEmbeddedWebApp, 250L);
                    } else {
                        revealLandingPage();
                    }
                });
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
        } else if (path.equals("/favicon.ico") || path.equals("/manifest.json") || path.equals("/manifest.webmanifest") || path.equals("/robots.txt")) {
            assetPath = "web" + path;
            mimeType = path.endsWith(".json") || path.endsWith(".webmanifest") ? "application/manifest+json" : path.endsWith(".txt") ? "text/plain" : "image/x-icon";
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
if old_method not in source:
    raise SystemExit("MainActivity createLogoSplash marker was not found")
source = source.replace(old_method, load_methods + old_method, 1)

# Give WebView enough compatibility for the local compiled bundle and its HTTPS backend.
settings_marker = "        settings.setMediaPlaybackRequiresUserGesture(false);\n"
settings_add = settings_marker + "        settings.setCacheMode(WebSettings.LOAD_DEFAULT);\n        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {\n            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);\n        }\n"
if settings_marker not in source:
    raise SystemExit("WebView settings marker was not found")
source = source.replace(settings_marker, settings_add, 1)

client_marker = '''        @Override\n        public void onPageFinished(WebView view, String url) {\n            revealLandingPage();\n        }\n'''
client_replacement = '''        @Override\n        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {\n            WebResourceResponse response = serveEmbeddedWebRequest(request);\n            return response != null ? response : super.shouldInterceptRequest(view, request);\n        }\n\n        @Override\n        public void onPageFinished(WebView view, String url) {\n            view.postDelayed(MainActivity.this::verifyEmbeddedDomAndReveal, 350L);\n        }\n\n        @Override\n        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {\n            if (request != null && request.isForMainFrame()) {\n                if (!embeddedStartupRetryUsed) {\n                    embeddedStartupRetryUsed = true;\n                    handler.postDelayed(MainActivity.this::loadEmbeddedWebApp, 250L);\n                } else {\n                    showNetworkError();\n                }\n            }\n        }\n\n        @Override\n        public void onReceivedHttpError(WebView view, WebResourceRequest request, android.webkit.WebResourceResponse errorResponse) {\n            if (request != null && request.isForMainFrame() && !embeddedStartupRetryUsed) {\n                embeddedStartupRetryUsed = true;\n                handler.postDelayed(MainActivity.this::loadEmbeddedWebApp, 250L);\n            }\n        }\n'''
if client_marker not in source:
    raise SystemExit("MainActivity WebViewClient marker was not found")
source = source.replace(client_marker, client_replacement, 1)

MAIN.write_text(source, encoding="utf-8")

if not (ASSETS / "index.html").exists():
    raise SystemExit("Embedded web bundle is missing: android-app/app/src/main/assets/web/index.html")

print("Embedded Android WebView prepared successfully")
