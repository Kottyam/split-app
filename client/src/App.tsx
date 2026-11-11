import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import InstallPromptDialog from "@/components/InstallPromptDialog";
import { Switch, Route, useLocation } from "wouter";
import Home from "./pages/Home";
import Trips from "./pages/Trips";
import SharedHomes from "./pages/SharedHomes";
import GroupFunds from "./pages/GroupFunds";
import CreateGroupFund from "./pages/CreateGroupFund";
import GroupFundDetail from "./pages/GroupFundDetail";
import Search from "./pages/Search";
import Notifications from "./pages/Notifications";
import More from "./pages/More";
import TripDetail from "./pages/TripDetail";
import SharedView from "./pages/SharedView";
import ShortShareView from "./pages/ShortShareView";
import OldSyncLink from "./pages/OldSyncLink";
import ImportKharcha from "./pages/ImportKharcha";
import AndroidImportListener from "./sync/AndroidImportListener";
import SharedHomeRedesign from "./pages/SharedHomeRedesign";
import SharedHomeDetail from "./pages/SharedHomeDetail";
import SharedHomeSharedView from "./pages/SharedHomeSharedView";
import SharedHomePaymentRequest from "./pages/SharedHomePaymentRequest";
import EditSyncRecipient from "./pages/EditSyncRecipient";
import SyncReview from "./pages/SyncReview";
import SyncUpdates from "./pages/SyncUpdates";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import { DeleteConfirmationProvider } from "./contexts/DeleteConfirmationContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLockGate from "./components/AppLockGate";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      {/* The bundled Android WebView opens the HTML entrypoint under /assets/web/. Treat that entrypoint as the app home so the first launch does not fall into the SPA 404 route. */}
      <Route path={"/assets/web/index.html"} component={Home} />
      <Route path={"/trips"} component={Trips} />
      <Route path={"/shared-homes"} component={SharedHomes} />
      <Route path={"/group-funds"} component={GroupFunds} />
      <Route path={"/group-funds/new"} component={CreateGroupFund} />
      <Route path={"/group-fund/:id"} component={GroupFundDetail} />
      <Route path={"/group-funds/:id"} component={GroupFundDetail} />
      <Route path={"/search"} component={Search} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/more"} component={More} />
      <Route path={"/trip/:id"} component={TripDetail} />
      <Route path={"/shared-home/:id/manage"} component={SharedHomeDetail} />
      <Route path={"/shared-home/:id"} component={SharedHomeRedesign} />
      <Route path={/^\/shared-home-share\/.+$/} component={SharedHomeSharedView} />
      <Route path={/^\/shared-home-payment\/.+$/} component={SharedHomePaymentRequest} />
      <Route path={/^\/share\/.+$/} component={SharedView} />
      <Route path={/^\/s\/[tf].+$/} component={ShortShareView} />
      <Route path={/^\/s\/e.+$/} component={EditSyncRecipient} />
      <Route path={/^\/s\/u.+$/} component={SyncReview} />
      <Route path="/import" component={ImportKharcha} />
      <Route path={/^\/edit-sync\/.+$/} component={OldSyncLink} />
      <Route path={/^\/sync-review\/.+$/} component={OldSyncLink} />
      <Route path="/sync-updates" component={SyncUpdates} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return (
    <div className="kharcha-app-shell min-h-screen pb-20">
      <AndroidImportListener />
      <Router />
      <BottomNav />
      <InstallPromptDialog />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider switchable>
      <LanguageProvider>
        <DeleteConfirmationProvider>
          {/* App lock covers every route, including shared links, because they can read or change local data. */}
          <AppLockGate>
            <AppShell />
          </AppLockGate>
          <Toaster position="top-center" richColors closeButton />
        </DeleteConfirmationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
