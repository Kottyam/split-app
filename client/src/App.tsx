import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AppLockGate from "./components/AppLockGate";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DeleteConfirmationProvider } from "./contexts/DeleteConfirmationContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import Trips from "./pages/Trips";
import SharedHomes from "./pages/SharedHomes";
import TripDetail from "./pages/TripDetail";
import SharedView from "./pages/SharedView";
import SharedHomeDetail from "./pages/SharedHomeDetail";
import SharedHomeSharedView from './pages/SharedHomeSharedView';
import SharedHomePaymentRequest from './pages/SharedHomePaymentRequest';
import GroupFunds from './pages/GroupFunds';
import CreateGroupFund from './pages/CreateGroupFund';
import GroupFundDetail from './pages/GroupFundDetail';
import PersonalBudget from './pages/PersonalBudget';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import More from "./pages/More";
import EditSyncRecipient from './pages/EditSyncRecipient';
import SyncReview from './pages/SyncReview';
import SyncUpdates from './pages/SyncUpdates';
import NotFound from "./pages/NotFound";
import BottomNav from './components/BottomNav';

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location]);

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/trips"} component={Trips} />
      <Route path={"/shared-homes"} component={SharedHomes} />
      <Route path={"/group-funds"} component={GroupFunds} />
      <Route path={"/group-funds/new"} component={CreateGroupFund} />
      <Route path={"/group-fund/:id"} component={GroupFundDetail} />
      <Route path={"/group-funds/:id"} component={GroupFundDetail} />
      <Route path={"/personal-budget"} component={PersonalBudget} />
      <Route path={"/search"} component={Search} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/more"} component={More} />
      <Route path={"/trip/:id"} component={TripDetail} />
      <Route path={"/shared-home/:id"} component={SharedHomeDetail} />
      <Route path={/^\/shared-home-share\/.+$/} component={SharedHomeSharedView} />
      <Route path={/^\/shared-home-payment\/.+$/} component={SharedHomePaymentRequest} />
      <Route path={/^\/share\/.+$/} component={SharedView} />
      <Route path={/^\/edit-sync\/.+$/} component={EditSyncRecipient} />
      <Route path={/^\/sync-review\/.+$/} component={SyncReview} />
      <Route path="/sync-updates" component={SyncUpdates} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <DeleteConfirmationProvider>
          <AppLockGate>
            <TooltipProvider>
              <Toaster />
              <div className="kharcha-app-shell">
                <Router />
                <BottomNav />
              </div>
            </TooltipProvider>
          </AppLockGate>
          </DeleteConfirmationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
