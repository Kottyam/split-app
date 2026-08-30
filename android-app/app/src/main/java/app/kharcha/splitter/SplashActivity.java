package app.kharcha.splitter;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Window;
import android.view.WindowManager;

/**
 * Android-only branded launch screen. It intentionally contains no login,
 * agreement, language selector, or user action; the stable native WebView
 * activity remains the actual application surface.
 */
public final class SplashActivity extends Activity {
    private static final long MIN_SPLASH_DURATION_MS = 950L;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean opened;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(0xFFFFFAF2);
        getWindow().setNavigationBarColor(0xFFFFFAF2);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
        setLightSystemBars();
        setContentView(R.layout.activity_splash);

        handler.postDelayed(this::openApp, MIN_SPLASH_DURATION_MS);
    }

    private void setLightSystemBars() {
        // Use legacy integer flags only. This keeps the splash compatible with
        // older Android WebView devices and avoids loading API-30-only classes.
        getWindow().getDecorView().setSystemUiVisibility(
                android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                        | android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
    }

    private void openApp() {
        if (opened || isFinishing()) return;
        opened = true;
        Intent intent = new Intent(this, MainActivity.class);
        // The embedded WebView avoids the device-specific TWA startup crash while
        // preserving the app’s own cookies and local WebView storage.
        if (getIntent().getData() != null) {
            intent.setAction(Intent.ACTION_VIEW);
            intent.setData(getIntent().getData());
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
