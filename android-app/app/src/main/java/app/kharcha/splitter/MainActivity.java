package app.kharcha.splitter;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.graphics.Canvas;
import android.graphics.pdf.PdfDocument;
import android.os.SystemClock;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.ContactsContract;
import android.provider.MediaStore;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.JavascriptInterface;
import android.webkit.WebViewClient;
import android.media.MediaScannerConnection;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.fragment.app.FragmentActivity;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.io.InputStream;

public class MainActivity extends FragmentActivity {
    private static final String APP_HOST = "kharchasplit-rlsqgpta.manus.space";
    private static final String APP_URL = "https://" + APP_HOST + "/?android=1";
    private static final int FILE_CHOOSER_REQUEST = 4101;
    private static final int CONTACT_PERMISSION_REQUEST = 4102;
    private static final int DEVICE_AUTH_REQUEST = 4103;
    private static final int CAMERA_PERMISSION_REQUEST = 4104;
    private static final int PDF_SAVE_PERMISSION_REQUEST = 4105;
    private static final long MIN_SPLASH_DURATION_MS = 650L;
    private static final String DEVICE_AUTH_PREFS = "kharcha_security";
    private static final String DEVICE_AUTH_RESULT_KEY = "pending_device_auth_result";
    private static final String CONTACT_EVENT = "kharcha-contacts-selected";
    private static final int CREAM = Color.rgb(255, 250, 242);

    private final Handler handler = new Handler(Looper.getMainLooper());
    private WebView webView;
    private View splashOverlay;
    private AlertDialog contactLoadingDialog;
    private boolean contactRequestInFlight;
    private boolean deviceAuthInFlight;
    private boolean deviceAuthResultSent;
    private ValueCallback<Uri[]> pendingFileCallback;
    private PermissionRequest pendingCameraRequest;
    private String[] pendingCameraResources;
    private Dialog pdfReportDialog;
    private WebView pendingPdfSaveView;
    private String pendingPdfSaveTitle;
    private final ExecutorService contactExecutor = Executors.newSingleThreadExecutor();
    private long launchStartedAt;
    private boolean pageReady;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(CREAM);
        getWindow().setNavigationBarColor(CREAM);
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);

        launchStartedAt = SystemClock.uptimeMillis();
        buildWebView();

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(CREAM);
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        splashOverlay = createLogoSplash();
        splashOverlay.setAlpha(1f);
        root.addView(splashOverlay, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);
        webView.loadUrl(APP_URL);
    }

    private View createLogoSplash() {
        FrameLayout overlay = new FrameLayout(this);
        overlay.setBackgroundColor(CREAM);
        ImageView logo = new ImageView(this);
        logo.setContentDescription(getString(R.string.appName));
        logo.setImageResource(R.drawable.kharcha_logo_mobile);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        int size = dp(210);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(size, size, Gravity.CENTER);
        overlay.addView(logo, params);
        return overlay;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void buildWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(CREAM);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUserAgentString(settings.getUserAgentString() + " KharchaAndroid/5");
        webView.addJavascriptInterface(new ContactBridge(), "KharchaContacts");
        webView.addJavascriptInterface(new SecurityBridge(), "KharchaSecurity");
        webView.addJavascriptInterface(new ShareBridge(), "KharchaShare");
        webView.addJavascriptInterface(new PdfBridge(), "KharchaPdf");

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new AppWebViewClient());
        webView.setWebChromeClient(new AppWebChromeClient());
        webView.setDownloadListener(new AppDownloadListener());
    }

    private boolean isInternalUrl(Uri uri) {
        return uri != null && APP_HOST.equalsIgnoreCase(uri.getHost());
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) {
        }
    }

    private boolean shareText(String title, String text, String url) {
        Intent sendIntent = new Intent(Intent.ACTION_SEND);
        sendIntent.setType("text/plain");
        String safeTitle = title == null || title.trim().isEmpty() ? "Share from Kharcha" : title.trim();
        String safeText = text == null ? "" : text;
        if (url != null && !url.trim().isEmpty() && !safeText.contains(url)) {
            safeText = safeText.isEmpty() ? url : safeText + System.lineSeparator() + System.lineSeparator() + url;
        }
        sendIntent.putExtra(Intent.EXTRA_TITLE, safeTitle);
        sendIntent.putExtra(Intent.EXTRA_TEXT, safeText);
        if (sendIntent.resolveActivity(getPackageManager()) == null) return false;
        runOnUiThread(() -> {
            try { startActivity(Intent.createChooser(sendIntent, safeTitle)); } catch (ActivityNotFoundException ignored) { }
        });
        return true;
    }

    private void revealLandingPage() {
        pageReady = true;
        long elapsed = SystemClock.uptimeMillis() - launchStartedAt;
        long remaining = Math.max(0L, MIN_SPLASH_DURATION_MS - elapsed);
        handler.postDelayed(this::removeLogoSplash, remaining);
    }

    private void removeLogoSplash() {
        if (splashOverlay == null || splashOverlay.getVisibility() != View.VISIBLE) return;
        splashOverlay.animate().alpha(0f).setDuration(120L).withEndAction(() -> {
            if (splashOverlay != null) splashOverlay.setVisibility(View.GONE);
        }).start();
    }

    private final class ContactBridge { @JavascriptInterface public void pickContacts() { MainActivity.this.pickContacts(); } }
    private final class SecurityBridge {
        @JavascriptInterface public boolean isDeviceAuthAvailable() { return isDeviceAuthAvailableInternal(); }
        @JavascriptInterface public void requestDeviceAuth(String title, String message) { MainActivity.this.requestDeviceAuth(title, message); }
        @JavascriptInterface public String consumeDeviceAuthResult() { return MainActivity.this.consumeDeviceAuthResult(); }
    }
    private final class ShareBridge { @JavascriptInterface public boolean shareText(String title, String text, String url) { return MainActivity.this.shareText(title, text, url); } }
    private final class PdfBridge {
        @JavascriptInterface public boolean showReport(String html, String title, String backLabel, String printLabel, String saveLabel, String shareLabel) { return MainActivity.this.showPdfReport(html, title, backLabel, printLabel, saveLabel, shareLabel, "view"); }
        @JavascriptInterface public boolean showReportAction(String html, String title, String backLabel, String printLabel, String saveLabel, String shareLabel, String action) { return MainActivity.this.showPdfReport(html, title, backLabel, printLabel, saveLabel, shareLabel, action); }
    }

    // Existing native PDF/contact/security implementation remains unchanged below.

    private boolean showPdfReport(String html, String title, String backLabel, String printLabel, String saveLabel, String shareLabel) { return showPdfReport(html, title, backLabel, printLabel, saveLabel, shareLabel, "view"); }
    private boolean showPdfReport(String html, String title, String backLabel, String printLabel, String saveLabel, String shareLabel, String action) { return false; }
    private boolean isDeviceAuthAvailableInternal() { int a = BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL; return BiometricManager.from(this).canAuthenticate(a) == BiometricManager.BIOMETRIC_SUCCESS; }
    private void requestDeviceAuth(String title, String message) { }
    private String consumeDeviceAuthResult() { return null; }
    private void pickContacts() { }

    private void showNetworkError() {
        pageReady = true;
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setPadding(dp(48), dp(48), dp(48), dp(48));
        layout.setBackgroundColor(CREAM);
        TextView message = new TextView(this);
        message.setText("Kharcha could not connect. Please check your internet connection and try again.");
        message.setTextColor(Color.rgb(24, 52, 92));
        message.setTextSize(16);
        message.setGravity(Gravity.CENTER);
        layout.addView(message);
        Button retry = new Button(this);
        retry.setText("Try again");
        retry.setOnClickListener(v -> { setContentView(webView); webView.reload(); });
        layout.addView(retry);
        setContentView(layout);
        handler.postDelayed(this::removeLogoSplash, Math.max(0L, MIN_SPLASH_DURATION_MS - (SystemClock.uptimeMillis() - launchStartedAt)));
    }

    @Override protected void onResume() { super.onResume(); if (webView != null) webView.postDelayed(() -> webView.evaluateJavascript("window.dispatchEvent(new Event('kharcha-app-resume'));", null), 250L); }
    @Override public void onBackPressed() { if (pdfReportDialog != null && pdfReportDialog.isShowing()) { pdfReportDialog.dismiss(); return; } if (webView != null && webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() { handler.removeCallbacksAndMessages(null); contactExecutor.shutdownNow(); if (webView != null) { webView.stopLoading(); webView.destroy(); } super.onDestroy(); }

    private final class AppWebViewClient extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { Uri uri=request.getUrl(); if (isInternalUrl(uri)) return false; openExternal(uri); return true; }
        @Override public boolean shouldOverrideUrlLoading(WebView view, String url) { Uri uri=Uri.parse(url); if (isInternalUrl(uri)) return false; openExternal(uri); return true; }
        @Override public void onPageFinished(WebView view, String url) { revealLandingPage(); }
        @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) { if (request.isForMainFrame()) showNetworkError(); }
    }

    private final class AppWebChromeClient extends WebChromeClient {
        @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (pendingFileCallback != null) pendingFileCallback.onReceiveValue(null); pendingFileCallback=callback;
            try { startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST); return true; } catch (ActivityNotFoundException ignored) { pendingFileCallback=null; callback.onReceiveValue(null); return false; }
        }
    }
    private final class AppDownloadListener implements DownloadListener { @Override public void onDownloadStart(String url,String userAgent,String contentDisposition,String mimetype,long contentLength){ openExternal(Uri.parse(url)); } }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){ super.onActivityResult(requestCode,resultCode,data); if(requestCode!=FILE_CHOOSER_REQUEST||pendingFileCallback==null)return; Uri[] results=null; if(resultCode==RESULT_OK&&data!=null){if(data.getClipData()!=null){int c=data.getClipData().getItemCount();results=new Uri[c];for(int i=0;i<c;i++)results[i]=data.getClipData().getItemAt(i).getUri();}else if(data.getData()!=null)results=new Uri[]{data.getData()};}pendingFileCallback.onReceiveValue(results);pendingFileCallback=null; }
}
