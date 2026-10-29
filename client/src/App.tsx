import { lazy, Suspense } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import ServiceDetail from "./pages/ServiceDetail";

const Admin = lazy(() => import("./pages/Admin"));

function Router() {
  return (
    <Suspense
      fallback={
        <div className="admin-gate">
          <div className="admin-spinner" />
        </div>
      }
    >
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/service/:id" component={ServiceDetail} />
        <Route path="/admin" component={Admin} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}

export default App;
