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
import android.webkit.WebResourceResponse;
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
import androidx.webkit.WebViewAssetLoader;
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
import java.io.ByteArrayOutputStream;

public class MainActivity extends FragmentActivity {
    private static final String APP_HOST = "www.kharchasplit.in";
    private static final String LOCAL_APP_URL = "https://appassets.androidplatform.net/assets/web/index.html?android=1";
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
    private WebViewAssetLoader assetLoader;
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
        loadLocalApp();
    }

    private void loadLocalApp() {
        try {
            webView.loadUrl(LOCAL_APP_URL);
        } catch (RuntimeException error) {
            showNetworkError();
        }
    }

    private void showNetworkError() {
        pageReady = true;
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setPadding(dp(48), dp(48), dp(48), dp(48));
        layout.setBackgroundColor(CREAM);

        TextView message = new TextView(this);
        message.setText("Kharcha could not load its local app. Please try again.");
        message.setTextColor(Color.rgb(24, 52, 92));
        message.setTextSize(16);
        message.setGravity(Gravity.CENTER);
        layout.addView(message);

        Button retry = new Button(this);
        retry.setText("Retry");
        retry.setOnClickListener(v -> {
            setContentView(webView);
            loadRemoteApp();
        });
        layout.addView(retry);
        setContentView(layout);
        handler.postDelayed(this::removeLogoSplash, Math.max(0L,
                MIN_SPLASH_DURATION_MS - (SystemClock.uptimeMillis() - launchStartedAt)));
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
        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView.setBackgroundColor(CREAM);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
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
        return uri != null && (APP_HOST.equalsIgnoreCase(uri.getHost()) || "appassets.androidplatform.net".equalsIgnoreCase(uri.getHost()));
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) {
            // The web app remains open when the phone has no handler for the external scheme.
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
            try {
                startActivity(Intent.createChooser(sendIntent, safeTitle));
            } catch (ActivityNotFoundException ignored) {
                // The web layer will use its clipboard fallback when no share target exists.
            }
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
        splashOverlay.animate()
                .alpha(0f)
                .setDuration(120L)
                .withEndAction(() -> {
                    if (splashOverlay != null) splashOverlay.setVisibility(View.GONE);
                })
                .start();
    }

    private final class ContactBridge {
        @JavascriptInterface
        public void pickContacts() {
            MainActivity.this.pickContacts();
        }
    }

    private final class SecurityBridge {
        @JavascriptInterface
        public boolean isDeviceAuthAvailable() {
            return isDeviceAuthAvailableInternal();
        }

        @JavascriptInterface
        public void requestDeviceAuth(String title, String message) {
            MainActivity.this.requestDeviceAuth(title, message);
        }

        @JavascriptInterface
        public String consumeDeviceAuthResult() {
            return MainActivity.this.consumeDeviceAuthResult();
        }
    }

    private final class ShareBridge {
        @JavascriptInterface
        public boolean shareText(String title, String text, String url) {
            return MainActivity.this.shareText(title, text, url);
        }
    }

    private final class PdfBridge {
        @JavascriptInterface
        public boolean showReport(String html, String title, String backLabel, String printLabel, String saveLabel, String shareLabel) {
            return MainActivity.this.showPdfReport(html, title, backLabel, printLabel, saveLabel, shareLabel, "view");
        }

        @JavascriptInterface
        public boolean showReportAction(String html, String title, String backLabel, String printLabel, String saveLabel, String shareLabel, String action) {
            return MainActivity.this.showPdfReport(html, title, backLabel, printLabel, saveLabel, shareLabel, action);
        }
    }

    private boolean showPdfReport(String html, String title, String backLabel, String printLabel, String saveLabel, String shareLabel) {
        return showPdfReport(html, title, backLabel, printLabel, saveLabel, shareLabel, "view");
    }

    private boolean showPdfReport(String html, String title, String backLabel, String printLabel, String saveLabel, String shareLabel, String action) {
        if (html == null || html.trim().isEmpty()) return false;
        runOnUiThread(() -> {
            if (pdfReportDialog != null && pdfReportDialog.isShowing()) pdfReportDialog.dismiss();

            final String initialAction = action == null ? "view" : action.trim().toLowerCase(Locale.ROOT);
            final Dialog dialog = new Dialog(this);
            final LinearLayout page = new LinearLayout(this);
            page.setOrientation(LinearLayout.VERTICAL);
            page.setBackgroundColor(Color.WHITE);

            LinearLayout toolbar = new LinearLayout(this);
            toolbar.setOrientation(LinearLayout.HORIZONTAL);
            toolbar.setGravity(Gravity.CENTER_VERTICAL);
            toolbar.setPadding(dp(8), dp(8), dp(8), dp(8));
            toolbar.setBackgroundColor(CREAM);

            Button back = pdfActionButton(safePdfLabel(backLabel, "Back"), Color.rgb(24, 52, 92));
            Button print = pdfActionButton(safePdfLabel(printLabel, "Print"), Color.rgb(22, 131, 75));
            Button save = pdfActionButton(safePdfLabel(saveLabel, "Save PDF"), Color.rgb(232, 120, 23));
            Button share = pdfActionButton(safePdfLabel(shareLabel, "Share"), Color.rgb(38, 95, 165));
            TextView heading = new TextView(this);
            heading.setText(safePdfLabel(title, "Kharcha report"));
            heading.setTextColor(Color.rgb(24, 52, 92));
            heading.setTextSize(15);
            heading.setTypeface(null, android.graphics.Typeface.BOLD);
            heading.setSingleLine(true);
            heading.setEllipsize(android.text.TextUtils.TruncateAt.END);
            heading.setGravity(Gravity.CENTER_VERTICAL);

            toolbar.addView(back, new LinearLayout.LayoutParams(dp(70), dp(46)));
            LinearLayout.LayoutParams headingParams = new LinearLayout.LayoutParams(0, dp(46), 1f);
            headingParams.leftMargin = dp(6);
            headingParams.rightMargin = dp(6);
            toolbar.addView(heading, headingParams);
            toolbar.addView(print, new LinearLayout.LayoutParams(dp(70), dp(46)));
            LinearLayout.LayoutParams saveParams = new LinearLayout.LayoutParams(dp(82), dp(46));
            saveParams.leftMargin = dp(6);
            toolbar.addView(save, saveParams);
            LinearLayout.LayoutParams shareParams = new LinearLayout.LayoutParams(dp(70), dp(46));
            shareParams.leftMargin = dp(6);
            toolbar.addView(share, shareParams);
            page.addView(toolbar);

            WebView reportView = new WebView(this);
            reportView.setBackgroundColor(Color.WHITE);
            reportView.setVerticalScrollBarEnabled(true);
            reportView.setHorizontalScrollBarEnabled(false);
            reportView.setInitialScale(100);
            reportView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
            final boolean[] reportReady = { false };
            reportView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    reportReady[0] = true;
                    if ("print".equals(initialAction) || "share".equals(initialAction)) {
                        view.postDelayed(() -> {
                            if (!reportReady[0] || !dialog.isShowing()) return;
                            if ("print".equals(initialAction)) printPdfReport(reportView, title);
                            else sharePdfReport(reportView, title);
                        }, 120);
                    }
                }

                @Override
                public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                    if (request.isForMainFrame()) reportReady[0] = false;
                }
            });
            WebSettings reportSettings = reportView.getSettings();
            reportSettings.setJavaScriptEnabled(false);
            reportSettings.setLoadWithOverviewMode(false);
            reportSettings.setUseWideViewPort(false);
            reportSettings.setDomStorageEnabled(false);
            reportSettings.setAllowFileAccess(false);
            reportSettings.setAllowContentAccess(false);
            reportView.loadDataWithBaseURL("https://" + APP_HOST + "/", html, "text/html", "UTF-8", null);
            page.addView(reportView, new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));

            back.setOnClickListener(v -> dialog.dismiss());
            print.setOnClickListener(v -> {
                if (!reportReady[0]) {
                    Toast.makeText(this, "Report is still loading", Toast.LENGTH_SHORT).show();
                    return;
                }
                printPdfReport(reportView, title);
            });
            save.setOnClickListener(v -> {
                if (!reportReady[0]) {
                    Toast.makeText(this, "Report is still loading", Toast.LENGTH_SHORT).show();
                    return;
                }
                savePdfReport(reportView, title);
            });
            share.setOnClickListener(v -> {
                if (!reportReady[0]) {
                    Toast.makeText(this, "Report is still loading", Toast.LENGTH_SHORT).show();
                    return;
                }
                sharePdfReport(reportView, title);
            });
            dialog.setOnDismissListener(ignored -> {
                if (pdfReportDialog == dialog) pdfReportDialog = null;
                reportView.stopLoading();
                reportView.destroy();
            });
            dialog.setContentView(page);
            pdfReportDialog = dialog;
            dialog.show();
            if (dialog.getWindow() != null) {
                dialog.getWindow().setLayout(
                        android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                        android.view.ViewGroup.LayoutParams.MATCH_PARENT);
                dialog.getWindow().setStatusBarColor(CREAM);
                dialog.getWindow().setNavigationBarColor(CREAM);
                dialog.getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
            }
        });
        return true;
    }

    private Button pdfActionButton(String text, int color) {
        Button button = pickerButton(text, color);
        button.setTextSize(12);
        button.setPadding(dp(3), 0, dp(3), 0);
        return button;
    }

    private String safePdfLabel(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private PrintAttributes pdfPrintAttributes() {
        return new PrintAttributes.Builder()
                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                .setResolution(new PrintAttributes.Resolution("kharcha", "Kharcha", 300, 300))
                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                .build();
    }

    private void printPdfReport(WebView reportView, String title) {
        PrintManager printManager = (PrintManager) getSystemService(PRINT_SERVICE);
        if (printManager == null) {
            Toast.makeText(this, "Printing is not available on this device", Toast.LENGTH_LONG).show();
            return;
        }
        try {
            PrintDocumentAdapter adapter = reportView.createPrintDocumentAdapter(safePdfLabel(title, "Kharcha report"));
            printManager.print(safePdfLabel(title, "Kharcha report"), adapter, pdfPrintAttributes());
            Toast.makeText(this, "Print dialog opened. Choose Save as PDF to download", Toast.LENGTH_SHORT).show();
        } catch (RuntimeException ignored) {
            Toast.makeText(this, "Could not open the print dialog", Toast.LENGTH_LONG).show();
        }
    }

    private String pdfFileName(String title) {
        String name = safePdfLabel(title, "kharcha-report")
                .replaceAll("[^a-zA-Z0-9._ -]", "_")
                .trim();
        if (name.isEmpty()) name = "kharcha-report";
        if (name.length() > 80) name = name.substring(0, 80).trim();
        return name.endsWith(".pdf") ? name : name + ".pdf";
    }

    private void savePdfReport(WebView reportView, String title) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
                && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            pendingPdfSaveView = reportView;
            pendingPdfSaveTitle = title;
            requestPermissions(new String[] { Manifest.permission.WRITE_EXTERNAL_STORAGE }, PDF_SAVE_PERMISSION_REQUEST);
            return;
        }
        try {
            writePdfToDownloads(reportView, title);
            Toast.makeText(this, "PDF saved to Downloads", Toast.LENGTH_SHORT).show();
        } catch (Exception ignored) {
            Toast.makeText(this, "Could not save the PDF to Downloads", Toast.LENGTH_LONG).show();
        }
    }

    private void writePdfToDownloads(WebView reportView, String title) throws IOException {
        String fileName = pdfFileName(title);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
            values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            values.put(MediaStore.Downloads.IS_PENDING, 1);
            Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) throw new IOException("Could not create the Downloads file");
            try {
                OutputStream output = getContentResolver().openOutputStream(uri);
                if (output == null) throw new IOException("Could not open the Downloads file");
                try (OutputStream stream = output) {
                    renderReportPdf(stream, reportView);
                }
                ContentValues completed = new ContentValues();
                completed.put(MediaStore.Downloads.IS_PENDING, 0);
                getContentResolver().update(uri, completed, null, null);
            } catch (Exception error) {
                getContentResolver().delete(uri, null, null);
                if (error instanceof IOException) throw (IOException) error;
                throw new IOException("Could not write the Downloads file", error);
            }
            return;
        }

        File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!downloads.exists() && !downloads.mkdirs()) throw new IOException("Could not create the Downloads folder");
        File outputFile = new File(downloads, fileName);
        if (outputFile.exists()) outputFile = new File(downloads, System.currentTimeMillis() + "-" + fileName);
        try (OutputStream output = new FileOutputStream(outputFile)) {
            renderReportPdf(output, reportView);
        }
        MediaScannerConnection.scanFile(this, new String[] { outputFile.getAbsolutePath() }, new String[] { "application/pdf" }, null);
    }

    private void sharePdfReport(WebView reportView, String title) {
        File shareDirectory = new File(getCacheDir(), "shared-reports");
        if (!shareDirectory.exists() && !shareDirectory.mkdirs()) {
            Toast.makeText(this, "Could not prepare the PDF for sharing", Toast.LENGTH_LONG).show();
            return;
        }
        File outputFile = new File(shareDirectory, System.currentTimeMillis() + "-" + pdfFileName(title));
        try (OutputStream output = new FileOutputStream(outputFile)) {
            renderReportPdf(output, reportView);
            output.flush();
            launchPdfShare(outputFile, title);
        } catch (Exception ignored) {
            outputFile.delete();
            Toast.makeText(this, "Could not share the PDF", Toast.LENGTH_LONG).show();
        }
    }

    private void launchPdfShare(File outputFile, String title) {
        try {
            Uri contentUri = FileProvider.getUriForFile(this, getString(R.string.providerAuthority), outputFile);
            Intent sendIntent = new Intent(Intent.ACTION_SEND);
            sendIntent.setType("application/pdf");
            sendIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            if (sendIntent.resolveActivity(getPackageManager()) == null) {
                Toast.makeText(this, "No app is available to share the PDF", Toast.LENGTH_LONG).show();
                return;
            }
            startActivity(Intent.createChooser(sendIntent, safePdfLabel(title, "Share Kharcha report")));
        } catch (Exception ignored) {
            Toast.makeText(this, "Could not share the PDF", Toast.LENGTH_LONG).show();
        }
    }

    private void renderReportPdf(OutputStream output, WebView reportView) throws IOException {
        PdfDocument document = new PdfDocument();
        try {
            reportView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
            int viewWidth = reportView.getWidth() > 0
                    ? reportView.getWidth()
                    : getResources().getDisplayMetrics().widthPixels;
            reportView.measure(
                    View.MeasureSpec.makeMeasureSpec(viewWidth, View.MeasureSpec.EXACTLY),
                    View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED));
            int density = Math.max(1, Math.round(getResources().getDisplayMetrics().density));
            int contentHeight = Math.round(reportView.getContentHeight() * density);
            int viewHeight = Math.max(Math.max(reportView.getMeasuredHeight(), contentHeight), dp(1));
            reportView.layout(0, 0, viewWidth, viewHeight);

            final int pageWidth = 595;
            final int pageHeight = 842;
            final int pageMargin = 40;
            final int printableWidth = pageWidth - (pageMargin * 2);
            final float scale = printableWidth / (float) Math.max(viewWidth, 1);
            final int printableHeight = pageHeight - (pageMargin * 2);
            final int contentHeightPerPage = Math.max(1, (int) (printableHeight / scale));
            int pageNumber = 1;
            for (int top = 0; top < viewHeight; top += contentHeightPerPage) {
                PdfDocument.Page page = document.startPage(new PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNumber++).create());
                Canvas canvas = page.getCanvas();
                canvas.save();
                canvas.translate(pageMargin, pageMargin);
                canvas.scale(scale, scale);
                canvas.translate(0, -top);
                reportView.draw(canvas);
                canvas.restore();
                document.finishPage(page);
            }
            document.writeTo(output);
        } finally {
            document.close();
        }
    }

    @JavascriptInterface
    public void pickContacts() {
        runOnUiThread(() -> {
            if (contactRequestInFlight) return;
            contactRequestInFlight = true;
            if (android.os.Build.VERSION.SDK_INT >= 23
                    && checkSelfPermission(Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[] { Manifest.permission.READ_CONTACTS }, CONTACT_PERMISSION_REQUEST);
            } else {
                showNativeContactPicker();
            }
        });
    }

    private void showNativeContactPicker() {
        showContactLoading();
        contactExecutor.execute(() -> {
            try {
                List<ContactRow> contacts = readContacts();
                runOnUiThread(() -> {
                    contactRequestInFlight = false;
                    hideContactLoading();
                    if (contacts.isEmpty()) {
                        Toast.makeText(this, "No contacts found", Toast.LENGTH_SHORT).show();
                        dispatchContacts(contacts);
                        return;
                    }

                Set<String> selectedKeys = new HashSet<>();
                LinearLayout content = new LinearLayout(this);
                content.setOrientation(LinearLayout.VERTICAL);
                content.setPadding(dp(20), dp(8), dp(20), dp(4));
                content.setBackgroundColor(Color.WHITE);

                EditText search = new EditText(this);
                search.setSingleLine(true);
                search.setTextColor(Color.rgb(24, 52, 92));
                search.setHintTextColor(Color.rgb(105, 114, 126));
                search.setHint("Search contact name or number");
                search.setTextSize(16);
                search.setPadding(dp(14), 0, dp(14), 0);
                search.setBackground(roundRect(CREAM, Color.rgb(22, 131, 75), 2, 14));
                content.addView(search, new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT, dp(50)));

                TextView selectedCount = new TextView(this);
                selectedCount.setText("0 contacts selected");
                selectedCount.setTextColor(Color.rgb(24, 52, 92));
                selectedCount.setTextSize(14);
                selectedCount.setTypeface(null, android.graphics.Typeface.BOLD);
                selectedCount.setPadding(0, dp(10), 0, dp(6));
                content.addView(selectedCount);

                LinearLayout selectionActions = new LinearLayout(this);
                selectionActions.setOrientation(LinearLayout.HORIZONTAL);
                selectionActions.setGravity(Gravity.CENTER_VERTICAL);
                Button selectAll = pickerButton("Select All", Color.rgb(22, 131, 75));
                Button clearAll = pickerButton("Clear All", Color.rgb(232, 120, 23));
                selectionActions.addView(selectAll, new LinearLayout.LayoutParams(0, dp(42), 1f));
                LinearLayout.LayoutParams clearParams = new LinearLayout.LayoutParams(0, dp(42), 1f);
                clearParams.leftMargin = dp(8);
                selectionActions.addView(clearAll, clearParams);
                content.addView(selectionActions);

                ListView contactList = new ListView(this);
                contactList.setDivider(null);
                contactList.setDividerHeight(0);
                contactList.setPadding(0, dp(10), 0, 0);
                contactList.setBackgroundColor(Color.rgb(250, 250, 250));
                LinearLayout.LayoutParams listParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT, dp(300));
                listParams.topMargin = dp(8);
                content.addView(contactList, listParams);

                TextView emptyState = new TextView(this);
                emptyState.setTextColor(Color.rgb(105, 114, 126));
                emptyState.setTextSize(15);
                emptyState.setGravity(Gravity.CENTER);
                emptyState.setPadding(0, dp(28), 0, dp(28));
                LinearLayout.LayoutParams emptyParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT, dp(300));
                emptyParams.topMargin = dp(8);
                content.addView(emptyState, emptyParams);

                AlertDialog dialog = new AlertDialog.Builder(this)
                        .setTitle("Add contacts")
                        .setView(content)
                        .setNegativeButton("Cancel", (ignored, which) -> dispatchContacts(new ArrayList<>()))
                        .setPositiveButton("Add selected", (ignored, which) -> {
                            List<ContactRow> selected = new ArrayList<>();
                            for (ContactRow contact : contacts) {
                                if (selectedKeys.contains(contactKey(contact))) selected.add(contact);
                            }
                            dispatchContacts(selected);
                        })
                        .create();

                ContactListAdapter adapter = new ContactListAdapter(contacts, selectedKeys, selectedCount);
                contactList.setAdapter(adapter);
                contactList.setEmptyView(emptyState);
                Runnable render = () -> {
                    String query = search.getText().toString().trim().toLowerCase(Locale.ROOT);
                    adapter.setQuery(query);
                    emptyState.setText(query.isEmpty() ? "No contacts available" : "No matching contacts");
                };
                search.addTextChangedListener(new TextWatcher() {
                    @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) { }
                    @Override public void onTextChanged(CharSequence s, int start, int before, int count) { render.run(); }
                    @Override public void afterTextChanged(Editable s) { }
                });
                selectAll.setOnClickListener(v -> adapter.selectAllVisible());
                clearAll.setOnClickListener(v -> adapter.clearAll());
                render.run();
                dialog.setOnCancelListener(ignored -> dispatchContacts(new ArrayList<>()));
                dialog.setOnShowListener(ignored -> {
                    stylePickerButton(dialog.getButton(AlertDialog.BUTTON_NEGATIVE), Color.rgb(24, 52, 92));
                    stylePickerButton(dialog.getButton(AlertDialog.BUTTON_POSITIVE), Color.rgb(22, 131, 75));
                });
                dialog.show();
                });
            } catch (SecurityException ignored) {
                runOnUiThread(() -> {
                    contactRequestInFlight = false;
                    hideContactLoading();
                    Toast.makeText(this, "Contacts permission is required", Toast.LENGTH_SHORT).show();
                    dispatchContacts(new ArrayList<>());
                });
            } catch (Exception ignored) {
                runOnUiThread(() -> {
                    contactRequestInFlight = false;
                    hideContactLoading();
                    Toast.makeText(this, "Could not read contacts", Toast.LENGTH_SHORT).show();
                    dispatchContacts(new ArrayList<>());
                });
            }
        });
    }

    private void showContactLoading() {
        if (contactLoadingDialog != null && contactLoadingDialog.isShowing()) return;
        LinearLayout loading = new LinearLayout(this);
        loading.setOrientation(LinearLayout.HORIZONTAL);
        loading.setGravity(Gravity.CENTER_VERTICAL);
        loading.setPadding(dp(24), dp(22), dp(24), dp(22));
        loading.setBackgroundColor(CREAM);

        ProgressBar spinner = new ProgressBar(this);
        spinner.setIndeterminate(true);
        loading.addView(spinner, new LinearLayout.LayoutParams(dp(32), dp(32)));

        TextView message = new TextView(this);
        message.setText("Reading contacts…");
        message.setTextColor(Color.rgb(24, 52, 92));
        message.setTextSize(16);
        message.setTypeface(null, android.graphics.Typeface.BOLD);
        message.setPadding(dp(14), 0, 0, 0);
        loading.addView(message, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, dp(42)));

        contactLoadingDialog = new AlertDialog.Builder(this)
                .setView(loading)
                .setCancelable(false)
                .create();
        contactLoadingDialog.setCanceledOnTouchOutside(false);
        contactLoadingDialog.show();
    }

    private void hideContactLoading() {
        if (contactLoadingDialog == null) return;
        contactLoadingDialog.dismiss();
        contactLoadingDialog = null;
    }

    private boolean isDeviceAuthAvailableInternal() {
        int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG
                | BiometricManager.Authenticators.DEVICE_CREDENTIAL;
        return BiometricManager.from(this).canAuthenticate(authenticators)
                == BiometricManager.BIOMETRIC_SUCCESS;
    }

    private void requestDeviceAuth(String title, String message) {
        runOnUiThread(() -> {
            if (deviceAuthInFlight) return;
            deviceAuthInFlight = true;
            deviceAuthResultSent = false;
            String promptTitle = title == null || title.isEmpty() ? "Unlock Kharcha" : title;
            String promptMessage = message == null || message.isEmpty()
                    ? "Use your fingerprint or phone screen lock to continue."
                    : message;
            BiometricManager biometricManager = BiometricManager.from(this);
            int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG
                    | BiometricManager.Authenticators.DEVICE_CREDENTIAL;
            int availability = biometricManager.canAuthenticate(authenticators);
            if (availability != BiometricManager.BIOMETRIC_SUCCESS) {
                dispatchDeviceAuthResult("unavailable");
                return;
            }
            try {
                BiometricPrompt prompt = new BiometricPrompt(
                        MainActivity.this,
                        ContextCompat.getMainExecutor(MainActivity.this),
                        new BiometricPrompt.AuthenticationCallback() {
                            @Override
                            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                                dispatchDeviceAuthResult("success");
                            }

                            @Override
                            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                                if (errorCode == BiometricPrompt.ERROR_CANCELED
                                        || errorCode == BiometricPrompt.ERROR_USER_CANCELED
                                        || errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON) {
                                    dispatchDeviceAuthResult("canceled");
                                } else {
                                    dispatchDeviceAuthResult("failed");
                                }
                            }
                        });
                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle(promptTitle)
                        .setSubtitle(promptMessage)
                        .setAllowedAuthenticators(authenticators)
                        .build();
                prompt.authenticate(promptInfo);
            } catch (RuntimeException ignored) {
                dispatchDeviceAuthResult("failed");
            }
        });
    }

    private void persistDeviceAuthResult(String result) {
        getSharedPreferences(DEVICE_AUTH_PREFS, MODE_PRIVATE)
                .edit()
                .putString(DEVICE_AUTH_RESULT_KEY, result)
                .apply();
    }

    private String consumeDeviceAuthResult() {
        android.content.SharedPreferences prefs = getSharedPreferences(DEVICE_AUTH_PREFS, MODE_PRIVATE);
        String result = prefs.getString(DEVICE_AUTH_RESULT_KEY, null);
        if (result != null) prefs.edit().remove(DEVICE_AUTH_RESULT_KEY).apply();
        return result;
    }

    private void dispatchDeviceAuthResult(String result) {
        if (deviceAuthResultSent) return;
        deviceAuthResultSent = true;
        deviceAuthInFlight = false;
        persistDeviceAuthResult(result);
        String safeResult = escapeJson(result);
        String script = "try { localStorage.setItem('kharcha_native_device_auth_result', '"
                + safeResult + "'); } catch (ignored) {}"
                + "window.dispatchEvent(new CustomEvent('kharcha-device-auth-result', {detail: '"
                + safeResult + "'}));";
        runOnUiThread(() -> {
            if (webView != null) webView.evaluateJavascript(script, null);
        });
    }

    private final class ContactListAdapter extends BaseAdapter {
        private final List<ContactRow> allContacts;
        private final List<ContactRow> visibleContacts = new ArrayList<>();
        private final Set<String> selectedKeys;
        private final TextView selectedCount;
        private String query = "";

        private ContactListAdapter(List<ContactRow> contacts, Set<String> selectedKeys, TextView selectedCount) {
            this.allContacts = contacts;
            this.selectedKeys = selectedKeys;
            this.selectedCount = selectedCount;
            setQuery("");
        }

        private void setQuery(String nextQuery) {
            query = nextQuery == null ? "" : nextQuery;
            visibleContacts.clear();
            for (ContactRow contact : allContacts) {
                if (matchesContact(contact, query)) visibleContacts.add(contact);
            }
            selectedCount.setText(selectedKeys.size() + " contacts selected");
            notifyDataSetChanged();
        }

        private void selectAllVisible() {
            for (ContactRow contact : visibleContacts) selectedKeys.add(contactKey(contact));
            selectedCount.setText(selectedKeys.size() + " contacts selected");
            notifyDataSetChanged();
        }

        private void clearAll() {
            selectedKeys.clear();
            selectedCount.setText("0 contacts selected");
            notifyDataSetChanged();
        }

        @Override public int getCount() { return visibleContacts.size(); }
        @Override public ContactRow getItem(int position) { return visibleContacts.get(position); }
        @Override public long getItemId(int position) { return position; }

        @Override public View getView(int position, View convertView, android.view.ViewGroup parent) {
            ContactRow contact = getItem(position);
            LinearLayout row = new LinearLayout(MainActivity.this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(dp(10), dp(5), dp(10), dp(5));
            row.setBackground(roundRect(Color.WHITE, Color.rgb(222, 229, 224), 1, 12));

            CheckBox checkBox = new CheckBox(MainActivity.this);
            checkBox.setButtonTintList(new android.content.res.ColorStateList(
                    new int[][] { new int[] { android.R.attr.state_checked }, new int[] {} },
                    new int[] { Color.rgb(22, 131, 75), Color.rgb(105, 114, 126) }));
            checkBox.setChecked(selectedKeys.contains(contactKey(contact)));
            TextView label = new TextView(MainActivity.this);
            label.setText(contact.tel.isEmpty() ? contact.name : contact.name + "\n" + contact.tel);
            label.setTextColor(Color.rgb(24, 52, 92));
            label.setTextSize(15);
            label.setGravity(Gravity.CENTER_VERTICAL);
            label.setMaxLines(2);
            row.addView(checkBox, new LinearLayout.LayoutParams(dp(48), dp(52)));
            row.addView(label, new LinearLayout.LayoutParams(0, dp(52), 1f));
            checkBox.setOnCheckedChangeListener((button, checked) -> {
                if (checked) selectedKeys.add(contactKey(contact));
                else selectedKeys.remove(contactKey(contact));
                selectedCount.setText(selectedKeys.size() + " contacts selected");
            });
            row.setOnClickListener(v -> checkBox.setChecked(!checkBox.isChecked()));
            return row;
        }
    }

    private void renderContactRows(List<ContactRow> contacts, Set<String> selectedKeys,
                                   EditText search, LinearLayout contactList, TextView selectedCount) {
        String query = search.getText().toString().trim().toLowerCase(Locale.ROOT);
        contactList.removeAllViews();
        int visible = 0;
        for (ContactRow contact : contacts) {
            if (!matchesContact(contact, query)) continue;
            visible++;
            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(dp(10), dp(5), dp(10), dp(5));
            row.setBackground(roundRect(Color.WHITE, Color.rgb(222, 229, 224), 1, 12));
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, dp(58));
            rowParams.bottomMargin = dp(6);

            CheckBox checkBox = new CheckBox(this);
            checkBox.setButtonTintList(new android.content.res.ColorStateList(
                    new int[][] { new int[] { android.R.attr.state_checked }, new int[] {} },
                    new int[] { Color.rgb(22, 131, 75), Color.rgb(105, 114, 126) }));
            checkBox.setChecked(selectedKeys.contains(contactKey(contact)));
            TextView label = new TextView(this);
            label.setText(contact.tel.isEmpty() ? contact.name : contact.name + "\n" + contact.tel);
            label.setTextColor(Color.rgb(24, 52, 92));
            label.setTextSize(15);
            label.setGravity(Gravity.CENTER_VERTICAL);
            label.setMaxLines(2);
            row.addView(checkBox, new LinearLayout.LayoutParams(dp(48), dp(52)));
            row.addView(label, new LinearLayout.LayoutParams(0, dp(52), 1f));
            checkBox.setOnCheckedChangeListener((button, checked) -> {
                if (checked) selectedKeys.add(contactKey(contact));
                else selectedKeys.remove(contactKey(contact));
                selectedCount.setText(selectedKeys.size() + " contacts selected");
            });
            row.setOnClickListener(v -> checkBox.setChecked(!checkBox.isChecked()));
            contactList.addView(row, rowParams);
        }
        if (visible == 0) {
            TextView empty = new TextView(this);
            empty.setText(query.isEmpty() ? "No contacts available" : "No matching contacts");
            empty.setTextColor(Color.rgb(105, 114, 126));
            empty.setTextSize(15);
            empty.setGravity(Gravity.CENTER);
            empty.setPadding(0, dp(28), 0, dp(28));
            contactList.addView(empty, new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        }
        selectedCount.setText(selectedKeys.size() + " contacts selected");
    }

    private boolean matchesContact(ContactRow contact, String query) {
        if (query.isEmpty()) return true;
        return contact.name.toLowerCase(Locale.ROOT).contains(query)
                || contact.tel.toLowerCase(Locale.ROOT).contains(query)
                || contact.email.toLowerCase(Locale.ROOT).contains(query);
    }

    private String contactKey(ContactRow contact) {
        return contact.name.toLowerCase(Locale.ROOT) + "|" + contact.tel;
    }

    private Button pickerButton(String text, int color) {
        Button button = new Button(this);
        button.setText(text);
        stylePickerButton(button, color);
        return button;
    }

    private void stylePickerButton(Button button, int color) {
        if (button == null) return;
        button.setAllCaps(false);
        button.setTextColor(Color.WHITE);
        button.setTextSize(14);
        button.setMinHeight(0);
        button.setMinWidth(0);
        button.setPadding(dp(6), 0, dp(6), 0);
        button.setBackground(roundRect(color, Color.TRANSPARENT, 0, 12));
    }

    private GradientDrawable roundRect(int fillColor, int strokeColor, int strokeWidth, int radiusDp) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(fillColor);
        drawable.setCornerRadius(dp(radiusDp));
        if (strokeWidth > 0) drawable.setStroke(dp(strokeWidth), strokeColor);
        return drawable;
    }

    private List<ContactRow> readContacts() {
        List<ContactRow> contacts = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        String[] projection = {
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER
        };
        Cursor cursor = getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                projection,
                null,
                null,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " COLLATE LOCALIZED ASC");
        if (cursor == null) return contacts;
        try {
            int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
            int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
            while (cursor.moveToNext()) {
                String name = nameIndex >= 0 ? cursor.getString(nameIndex) : "";
                String tel = numberIndex >= 0 ? cursor.getString(numberIndex) : "";
                if (name == null) name = "";
                if (tel == null) tel = "";
                name = name.trim();
                tel = tel.trim();
                if (name.isEmpty()) continue;
                String key = name.toLowerCase(Locale.ROOT) + "|" + tel;
                if (seen.add(key)) contacts.add(new ContactRow(name, tel, ""));
            }
        } finally {
            cursor.close();
        }
        return contacts;
    }

    private void dispatchContacts(List<ContactRow> contacts) {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < contacts.size(); i++) {
            if (i > 0) json.append(',');
            ContactRow contact = contacts.get(i);
            json.append("{\"name\":\"").append(escapeJson(contact.name))
                    .append("\",\"tel\":\"").append(escapeJson(contact.tel))
                    .append("\",\"email\":\"").append(escapeJson(contact.email)).append("\"}");
        }
        json.append(']');
        String script = "window.dispatchEvent(new CustomEvent('" + CONTACT_EVENT
                + "', {detail: " + json + "}));";
        runOnUiThread(() -> {
            if (webView != null) webView.evaluateJavascript(script, null);
        });
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n")
                .replace("\u2028", "\\u2028")
                .replace("\u2029", "\\u2029");
    }

    private static final class ContactRow {
        private final String name;
        private final String tel;
        private final String email;

        private ContactRow(String name, String tel, String email) {
            this.name = name;
            this.tel = tel;
            this.email = email;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_REQUEST) {
            PermissionRequest request = pendingCameraRequest;
            String[] resources = pendingCameraResources;
            pendingCameraRequest = null;
            pendingCameraResources = null;
            if (request == null || resources == null) return;
            try {
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    request.grant(resources);
                } else {
                    request.deny();
                    Toast.makeText(this, "Camera permission is required to scan a merchant QR code", Toast.LENGTH_LONG).show();
                }
            } catch (RuntimeException ignored) {
                // WebView may cancel a request while the Android permission dialog is open.
            }
            return;
        }
        if (requestCode == PDF_SAVE_PERMISSION_REQUEST) {
            WebView view = pendingPdfSaveView;
            String title = pendingPdfSaveTitle;
            pendingPdfSaveView = null;
            pendingPdfSaveTitle = null;
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED && view != null) {
                savePdfReport(view, title);
            } else {
                Toast.makeText(this, "Storage permission is required to save the PDF", Toast.LENGTH_LONG).show();
            }
            return;
        }
        if (requestCode != CONTACT_PERMISSION_REQUEST) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            showNativeContactPicker();
        } else {
            contactRequestInFlight = false;
            Toast.makeText(this, "Contacts permission is required", Toast.LENGTH_SHORT).show();
            dispatchContacts(new ArrayList<>());
        }
    }

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
        retry.setOnClickListener(v -> {
            setContentView(webView);
            webView.reload();
        });
        layout.addView(retry);
        setContentView(layout);
        handler.postDelayed(this::removeLogoSplash, Math.max(0L,
                MIN_SPLASH_DURATION_MS - (SystemClock.uptimeMillis() - launchStartedAt)));
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.postDelayed(() -> webView.evaluateJavascript(
                    "window.dispatchEvent(new Event('kharcha-app-resume'));", null), 250L);
        }
    }

    @Override
    public void onBackPressed() {
        if (pdfReportDialog != null && pdfReportDialog.isShowing()) {
            pdfReportDialog.dismiss();
            return;
        }
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (pendingCameraRequest != null) {
            try {
                pendingCameraRequest.deny();
            } catch (RuntimeException ignored) {
                // The WebView may have canceled the request already.
            }
            pendingCameraRequest = null;
            pendingCameraResources = null;
        }
        hideContactLoading();
        if (pdfReportDialog != null && pdfReportDialog.isShowing()) pdfReportDialog.dismiss();
        pdfReportDialog = null;
        contactRequestInFlight = false;
        deviceAuthInFlight = false;
        deviceAuthResultSent = true;
        contactExecutor.shutdownNow();
        if (pendingFileCallback != null) {
            pendingFileCallback.onReceiveValue(null);
            pendingFileCallback = null;
        }
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }

    private final class AppWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isInternalUrl(uri)) return false;
            openExternal(uri);
            return true;
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            WebResourceResponse response = assetLoader == null ? null : assetLoader.shouldInterceptRequest(request.getUrl());
            return response != null ? response : super.shouldInterceptRequest(view, request);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            Uri uri = Uri.parse(url);
            if (isInternalUrl(uri)) return false;
            openExternal(uri);
            return true;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            revealLandingPage();
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) showLocalLoadError();
        }
    }

    private boolean isTrustedPermissionOrigin(PermissionRequest request) {
        Uri origin = request == null ? null : request.getOrigin();
        return origin != null
                && "https".equalsIgnoreCase(origin.getScheme())
                && APP_HOST.equalsIgnoreCase(origin.getHost());
    }

    private final class AppWebChromeClient extends WebChromeClient {
        @Override
        public void onPermissionRequest(PermissionRequest request) {
            runOnUiThread(() -> {
                if (!isTrustedPermissionOrigin(request)) {
                    request.deny();
                    return;
                }

                List<String> videoResources = new ArrayList<>();
                for (String resource : request.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                        videoResources.add(resource);
                    }
                }
                if (videoResources.isEmpty()) {
                    request.deny();
                    return;
                }

                if (pendingCameraRequest != null && pendingCameraRequest != request) {
                    try {
                        pendingCameraRequest.deny();
                    } catch (RuntimeException ignored) {
                        // The previous WebView request may already have been canceled.
                    }
                }
                String[] resources = videoResources.toArray(new String[0]);
                if (android.os.Build.VERSION.SDK_INT < 23
                        || checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                    request.grant(resources);
                    return;
                }

                pendingCameraRequest = request;
                pendingCameraResources = resources;
                requestPermissions(new String[] { Manifest.permission.CAMERA }, CAMERA_PERMISSION_REQUEST);
            });
        }

        @Override
        public void onPermissionRequestCanceled(PermissionRequest request) {
            if (pendingCameraRequest == request) {
                pendingCameraRequest = null;
                pendingCameraResources = null;
            }
        }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                         FileChooserParams params) {
            if (pendingFileCallback != null) pendingFileCallback.onReceiveValue(null);
            pendingFileCallback = callback;
            Intent intent = params.createIntent();
            try {
                startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                return true;
            } catch (ActivityNotFoundException ignored) {
                pendingFileCallback = null;
                callback.onReceiveValue(null);
                return false;
            }
        }
    }

    private final class AppDownloadListener implements DownloadListener {
        @Override
        public void onDownloadStart(String url, String userAgent, String contentDisposition,
                                    String mimetype, long contentLength) {
            openExternal(Uri.parse(url));
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == DEVICE_AUTH_REQUEST) {
            dispatchDeviceAuthResult(resultCode == RESULT_OK ? "success" : "canceled");
            return;
        }
        if (requestCode != FILE_CHOOSER_REQUEST || pendingFileCallback == null) return;
        Uri[] results = null;
        if (resultCode == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                results = new Uri[count];
                for (int i = 0; i < count; i++) results[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) {
                results = new Uri[] { data.getData() };
            }
        }
        pendingFileCallback.onReceiveValue(results);
        pendingFileCallback = null;
    }
}
