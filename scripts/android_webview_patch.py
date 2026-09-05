from pathlib import Path

ACTIVITY = Path("android-app/app/src/main/java/app/kharcha/splitter/MainActivity.java")
text = ACTIVITY.read_text()

text = text.replace(
    'import androidx.fragment.app.FragmentActivity;\n',
    'import androidx.fragment.app.FragmentActivity;\nimport androidx.webkit.WebViewAssetLoader;\n',
)
text = text.replace(
    'import android.webkit.WebResourceRequest;\n',
    'import android.webkit.WebResourceRequest;\nimport android.webkit.WebResourceResponse;\n',
)
text = text.replace(
    'import java.io.InputStream;\n',
    'import java.io.InputStream;\nimport java.io.ByteArrayOutputStream;\n',
)

if 'private WebViewAssetLoader assetLoader;' not in text:
    text = text.replace(
        '    private WebView webView;\n',
        '    private WebView webView;\n    private WebViewAssetLoader assetLoader;\n',
    )

text = text.replace(
    '        webView.loadUrl(APP_URL);',
    '        loadBundledApp();',
)

if 'private void loadBundledApp()' not in text:
    method = '''    private void loadBundledApp() {
        try (InputStream input = getAssets().open("web/index.html");
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            String html = output.toString("UTF-8");
            html = html.replace("./assets/", "https://appassets.androidplatform.net/assets/web/assets/");
            html = html.replace("./manifest.json", "https://appassets.androidplatform.net/assets/web/manifest.json");
            webView.loadDataWithBaseURL(
                    "https://" + APP_HOST + "/",
                    html,
                    "text/html",
                    "UTF-8",
                    "https://" + APP_HOST + "/");
        } catch (Exception error) {
            showNetworkError();
        }
    }

'''
    text = text.replace('    private View createLogoSplash() {', method + '    private View createLogoSplash() {')

text = text.replace(
    'return uri != null && APP_HOST.equalsIgnoreCase(uri.getHost());',
    'return uri != null && (APP_HOST.equalsIgnoreCase(uri.getHost()) || "appassets.androidplatform.net".equalsIgnoreCase(uri.getHost()));',
)

if 'assetLoader = new WebViewAssetLoader.Builder()' not in text:
    text = text.replace(
        '        webView.setWebViewClient(new AppWebViewClient());',
        '''        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/web/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView.setWebViewClient(new AppWebViewClient());''',
    )

if 'WebResourceResponse response = assetLoader' not in text:
    text = text.replace(
        '        public void onPageFinished(WebView view, String url) {',
        '''        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            WebResourceResponse response = assetLoader == null
                    ? null
                    : assetLoader.shouldInterceptRequest(request.getUrl());
            return response != null ? response : super.shouldInterceptRequest(view, request);
        }

        @Override
        public void onPageFinished(WebView view, String url) {''',
    )

old = '            if (isInternalUrl(uri)) return false;'
new = '''            if (APP_HOST.equalsIgnoreCase(uri.getHost())
                    && (uri.getPath() == null || "/".equals(uri.getPath()))) {
                loadBundledApp();
                return true;
            }
            if (isInternalUrl(uri)) return false;'''
text = text.replace(old, new)

# Keep camera permission trust compatible with the bundled asset origin too.
text = text.replace(
    '                && APP_HOST.equalsIgnoreCase(origin.getHost());',
    '                && (APP_HOST.equalsIgnoreCase(origin.getHost()) || "appassets.androidplatform.net".equalsIgnoreCase(origin.getHost()));',
)

ACTIVITY.write_text(text)
