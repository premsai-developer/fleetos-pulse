import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TripsDemand from './pages/TripsDemand';
import TripDetail from './pages/TripDetail';
import TrueDemand from './pages/TrueDemand';
import Decisions from './pages/Decisions';
import Profitability from './pages/Profitability';
import Leakage from './pages/Leakage';
import TripTwin from './pages/TripTwin';
import Disruption from './pages/Disruption';
import Passenger from './pages/Passenger';
import TrustGuard from './pages/TrustGuard';
import Audit from './pages/Audit';
import SettingsPricingRules from './pages/SettingsPricingRules';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="trips" element={<TripsDemand />} />
        <Route path="trips/:id" element={<TripDetail />} />
        <Route path="truedemand" element={<TrueDemand />} />
        <Route path="recommendations" element={<Decisions />} />
        <Route path="decisions" element={<Decisions />} />
        <Route path="profitability" element={<Profitability />} />
        <Route path="leakage" element={<Leakage />} />
        <Route path="scenarios" element={<TripTwin />} />
        <Route path="twin" element={<TripTwin />} />
        <Route path="disruption" element={<Disruption />} />
        <Route path="passenger" element={<Passenger />} />
        <Route path="data-health" element={<TrustGuard />} />
        <Route path="trustguard" element={<TrustGuard />} />
        <Route path="audit" element={<Audit />} />
        <Route path="settings" element={<SettingsPricingRules />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
