import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ChevronsLeft,
  ChevronsRight,
  History,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Split,
  Route as RouteIcon,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  PlayCircle,
  LifeBuoy,
  UserCheck,
  ActivitySquare,
  Settings,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Compass
} from 'lucide-react';
import { useApp } from '../context/AppState';
import { cx, SimTag } from './ui';

const DEMO_STEPS = [
  { step: 1, title: 'Overview Dashboard', path: '/', desc: 'Monitor active fleet, occupancy rate, yield lift, and data health.' },
  { step: 2, title: 'Trips & Demand', path: '/trips', desc: 'Inspect departures, booking velocity, and unserved demand indicators.' },
  { step: 3, title: 'TrueDemand Engine', path: '/truedemand', desc: 'Examine latent demand signals, confidence ratings, and underlying models.' },
  { step: 4, title: 'Price Recommendations', path: '/recommendations', desc: 'Review algorithmic fare adjustments & FairFare guardrails.' },
  { step: 5, title: 'Operator Approval', path: '/recommendations', desc: 'Approve recommendation to update SQLite database in real time.' },
  { step: 6, title: 'Passenger Companion', path: '/passenger', desc: 'Observe passenger ticket view updated with transparent approved fare.' },
  { step: 7, title: 'Data Health & Safeguard', path: '/data-health', desc: 'Trigger Scenario C (Stale Data) to demonstrate automated guardrails.' },
  { step: 8, title: 'Audit Trail & Compliance', path: '/audit', desc: 'Review immutable audit trail of operator decisions and system events.' }
];

export default function Layout() {
  const { trips, scenario, setScenario, dataHealth, setDataHealth, error, reload, activeDemoStep, setDemoStep, triggerDemoScenario, resetDemo } = useApp();

  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const currentStep = DEMO_STEPS.find(s => s.step === activeDemoStep) || DEMO_STEPS[0];

  const handleStepJump = (stepNum: number) => {
    setDemoStep(stepNum);
    const target = DEMO_STEPS.find(s => s.step === stepNum);
    if (target) navigate(target.path);
  };

  const navGroups = [
    {
      group: 'OPERATIONS',
      items: [
        { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/trips', label: 'Trips & Demand', icon: RouteIcon, match: '/trips' },
        { to: '/truedemand', label: 'TrueDemand Engine', icon: TrendingUp },
        { to: '/recommendations', label: 'Recommendations', icon: Split }
      ]
    },
    {
      group: 'FINANCIAL & ANALYTICS',
      items: [
        { to: '/profitability', label: 'Fleet Profit Twin', icon: DollarSign },
        { to: '/leakage', label: 'Revenue Leakage', icon: AlertTriangle }
      ]
    },
    {
      group: 'SIMULATION & RECOVERY',
      items: [
        { to: '/scenarios', label: 'Scenario Simulator', icon: PlayCircle },
        { to: '/disruption', label: 'Disruption Recovery', icon: LifeBuoy }
      ]
    },
    {
      group: 'PASSENGER & AUDIT',
      items: [
        { to: '/passenger', label: 'Passenger Companion', icon: UserCheck },
        { to: '/data-health', label: 'Data Health', icon: ActivitySquare },
        { to: '/audit', label: 'Audit Log', icon: ShieldCheck },
        { to: '/settings', label: 'Settings & Rules', icon: Settings }
      ]
    }
  ];

  return (
    <div className="flex min-h-screen bg-app-bg text-dark font-sans">
      {/* Mobile Drawer Overlay */}
      {mobile && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden" onClick={() => setMobile(false)} />}

      {/* Sidebar */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-subtle bg-panel transition-all duration-200 lg:sticky lg:top-0 lg:h-screen shadow-sm',
          collapsed ? 'lg:w-16' : 'lg:w-64',
          'w-64',
          mobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b border-subtle px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest text-white shadow-sm">
            <Activity size={20} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-bold text-dark leading-snug tracking-tight text-base">FleetOS Pulse</div>
              <div className="text-[11px] font-medium text-mute">Trust-Aware Fleet Intelligence</div>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navGroups.map((g, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-mute uppercase">
                  {g.group}
                </div>
              )}
              {g.items.map(n => (
                <NavLink
                  key={n.label}
                  to={n.to}
                  end={n.end}
                  onClick={() => setMobile(false)}
                  title={n.label}
                  className={({ isActive }) =>
                    cx(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold transition-colors',
                      (n.match ? pathname.startsWith(n.match) : isActive)
                        ? 'bg-forest-light text-forest'
                        : 'text-mute hover:bg-gray-100 hover:text-dark'
                    )
                  }
                >
                  <n.icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{n.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar Collapse Toggle */}
        <div className="border-t border-subtle p-2">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-mute hover:bg-gray-100 hover:text-dark lg:flex"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronsRight size={18} /> : <><ChevronsLeft size={18} /><span>Collapse Navigation</span></>}
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex flex-col border-b border-subtle bg-panel/95 backdrop-blur-md">
          {/* Main Top Navbar */}
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <button className="lg:hidden text-dark hover:text-forest" aria-label="Open menu" onClick={() => setMobile(true)}>
                <Menu size={22} />
              </button>
              <SimTag text="SAMARTHA Demo Dataset" />
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="inline-flex items-center gap-1.5 rounded-md bg-forest-light px-2.5 py-1 text-xs font-bold text-forest hover:bg-forest/15 transition-colors"
              >
                <Compass size={14} />
                <span>{showGuide ? 'Hide Presenter Guide' : 'Show Presenter Guide'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Scenario Fast Selector */}
              <div className="hidden md:flex items-center gap-1.5 bg-gray-50 border border-subtle p-1 rounded-lg">
                <span className="text-[11px] font-bold text-mute px-2">Scenarios:</span>
                <button
                  onClick={async () => { await triggerDemoScenario('capacity_shortage'); handleStepJump(2); }}
                  className="px-2 py-1 text-[11px] font-semibold rounded bg-white hover:bg-forest-light hover:text-forest border border-subtle transition-colors"
                  title="Scenario A: Sold out departure with latent demand"
                >
                  A: Shortage
                </button>
                <button
                  onClick={async () => { await triggerDemoScenario('low_demand'); handleStepJump(4); }}
                  className="px-2 py-1 text-[11px] font-semibold rounded bg-white hover:bg-forest-light hover:text-forest border border-subtle transition-colors"
                  title="Scenario B: Low demand departure requiring promo adjustment"
                >
                  B: Low Demand
                </button>
                <button
                  onClick={async () => { await triggerDemoScenario('stale_data'); handleStepJump(7); }}
                  className="px-2 py-1 text-[11px] font-semibold rounded bg-white hover:bg-red-50 hover:text-red-err border border-subtle transition-colors"
                  title="Scenario C: Stale data feed causing recommendation blockage"
                >
                  C: Stale Data
                </button>
                <button
                  onClick={async () => { await triggerDemoScenario('operator_approval'); handleStepJump(5); }}
                  className="px-2 py-1 text-[11px] font-semibold rounded bg-white hover:bg-forest-light hover:text-forest border border-subtle transition-colors"
                  title="Scenario D: Operator recommendation approval flow"
                >
                  D: Approval
                </button>
              </div>

              {/* Demo Reset Button */}
              <button
                onClick={resetDemo}
                className="flex items-center gap-1.5 rounded-md border border-subtle bg-white px-2.5 py-1 text-xs font-semibold text-dark hover:bg-gray-100 transition-colors shadow-xs"
                title="Reset database to initial demo state"
              >
                <RotateCcw size={13} />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>

          {/* Interactive Presenter Walkthrough Bar */}
          {showGuide && (
            <div className="border-t border-subtle bg-forest-light/60 px-4 py-2 lg:px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-white shrink-0">
                  {currentStep.step}
                </span>
                <span className="font-bold text-dark truncate">
                  Step {currentStep.step} of {DEMO_STEPS.length}: {currentStep.title}
                </span>
                <span className="hidden lg:inline text-mute border-l border-subtle pl-2">
                  {currentStep.desc}
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  disabled={activeDemoStep <= 1}
                  onClick={() => handleStepJump(activeDemoStep - 1)}
                  className="p-1 rounded bg-white border border-subtle text-dark hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Previous demo step"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-medium text-mute px-1">
                  {activeDemoStep}/{DEMO_STEPS.length}
                </span>
                <button
                  disabled={activeDemoStep >= DEMO_STEPS.length}
                  onClick={() => handleStepJump(activeDemoStep + 1)}
                  className="p-1 rounded bg-white border border-subtle text-dark hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next demo step"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 lg:p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-err/30 bg-red-50 p-4 text-xs text-red-err flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <div>
                  <strong className="font-bold">Backend Communication Warning:</strong> {error}
                </div>
              </div>
              <button onClick={reload} className="px-3 py-1 bg-red-err text-white font-semibold rounded hover:bg-red-700">
                Retry API
              </button>
            </div>
          )}
          <Outlet />
        </main>

      </div>
    </div>
  );
}


