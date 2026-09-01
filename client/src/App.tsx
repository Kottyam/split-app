import React from "react";
import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import Trips from "./pages/Trips";
import SharedHomes from "./pages/SharedHomes";
import GroupFunds from "./pages/GroupFunds";
import CreateGroupFund from "./pages/CreateGroupFund";
import GroupFundDetail from "./pages/GroupFundDetail";
import PersonalBudget from "./pages/PersonalBudget";
import Search from "./pages/Search";
import Notifications from "./pages/Notifications";
import More from "./pages/More";
import TripDetail from "./pages/TripDetail";
import SharedView from "./pages/SharedView";
import SharedHomeDetail from "./pages/SharedHomeDetail";
import SharedHomeSharedView from './pages/SharedHomeSharedView';
import SharedHomePaymentRequest from './pages/SharedHomePaymentRequest';
import EditSyncRecipient from './pages/EditSyncRecipient';
import SyncReview from './pages/SyncReview';
import SyncUpdates from './pages/SyncUpdates';
import NotFound from './pages/NotFound';

function Router() {
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
      {/* Shared Home uses the existing fully-functional detail screen as the canonical editor. */}
      <Route path={"/shared-home/:id"} component={SharedHomeDetail} />
      <Route path={"/shared-home/:id/manage"} component={SharedHomeDetail} />
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

export default function App() {
  return <Router />;
}
