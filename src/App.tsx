const UserAccessView = lazy(() => import('./views/UserAccessView').then(module => ({default:module.UserAccessView})));
const CashierDashboardView = lazy(() => import('./views/CashierDashboardView').then(module => ({default:module.CashierDashboardView})));
const CashierAccountsView = lazy(() => import('./views/CashierAccountsView').then(module => ({default:module.CashierAccountsView})));
const CashierJobModal = lazy(() => import('./modals/CashierJobModal').then(module => ({default:module.CashierJobModal})));
import { useCloseConfirmation } from './hooks/useCloseConfirmation';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
const AdminDashboardView = lazy(() => import('./views/AdminDashboardView').then(module => ({default:module.AdminDashboardView})));
const TechnicianDashboardView = lazy(() => import('./views/TechnicianDashboardView').then(module => ({default:module.TechnicianDashboardView})));
const Forbidden403View = lazy(() => import('./views/Forbidden403View').then(module => ({default:module.Forbidden403View})));
const ServiceView = lazy(() => import('./views/ServiceView').then(module => ({default:module.ServiceView})));
const TechnicianDeskView = lazy(() => import('./views/TechnicianDeskView').then(module => ({default:module.TechnicianDeskView})));
const CustomersView = lazy(() => import('./views/CustomersView').then(module => ({default:module.CustomersView})));
const DevicesView = lazy(() => import('./views/DevicesView').then(module => ({default:module.DevicesView})));
const TechniciansView = lazy(() => import('./views/TechniciansView').then(module => ({default:module.TechniciansView})));
const RepairRecordsView = lazy(() => import('./views/RepairRecordsView').then(module => ({default:module.RepairRecordsView})));
const FinanceView = lazy(() => import('./views/FinanceView').then(module => ({default:module.FinanceView})));
const ReportsView = lazy(() => import('./views/ReportsView').then(module => ({default:module.ReportsView})));
const SettingsView = lazy(() => import('./views/SettingsView').then(module => ({default:module.SettingsView})));
const AboutView = lazy(() => import('./views/AboutView').then(module => ({default:module.AboutView})));
const UserGuideView = lazy(() => import('./views/UserGuideView').then(module => ({default:module.UserGuideView})));
import { LoginView } from './components/LoginView';
const JobDetailModal = lazy(() => import('./modals/JobDetailModal').then(module => ({default:module.JobDetailModal})));
const NewTicketModal = lazy(() => import('./modals/NewTicketModal').then(module => ({default:module.NewTicketModal})));
const PrintTicketModal = lazy(() => import('./modals/PrintTicketModal').then(module => ({default:module.PrintTicketModal})));
import { ServiceJob } from './types';

const AuthenticatedLayout: React.FC = () => {
  const { role, activeTab, currentPath, navigate, jobs } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ServiceJob | null>(null);
  const [newJobModalOpen, setNewJobModalOpen] = useState(false);
  const [printJob, setPrintJob] = useState<ServiceJob | null>(null);

  const handleOpenJob = (job: ServiceJob) => {
    setSelectedJob(job);
  };

  const handlePrintReceipt = (job: ServiceJob) => {
    setPrintJob(job);
  };

  const handleCreatedJob = (jobId: string) => {
    setNewJobModalOpen(false);
    const created = jobs.find((j) => j.id === jobId);
    if (created) {
      setSelectedJob(created);
    }
  };

  // Render view based on route & role permissions
  const renderActiveView = () => {
    if (role === 'cashier') {
      if (activeTab === 'about') return <AboutView />;
      if (activeTab === 'records') return <RepairRecordsView onOpenJob={handleOpenJob} />;
      if (activeTab === 'customers') return <CustomersView onOpenJob={handleOpenJob} />;
      if (!['dashboard','service'].includes(activeTab)) return <div className="p-6">Cashier access: intake, payments, repair records and customers.</div>;
      return activeTab === 'dashboard' ? <CashierDashboardView onNewJob={() => setNewJobModalOpen(true)} onOpenJob={handleOpenJob} onPrintReceipt={handlePrintReceipt} /> : <ServiceView onOpenJob={handleOpenJob} onNewJob={() => setNewJobModalOpen(true)} onPrintReceipt={handlePrintReceipt} />;
    }
    if (role === 'technician' && ['records','customers'].includes(activeTab)) return <TechnicianDeskView onOpenJob={handleOpenJob} />;
    // 1. Explicit Route Checks
    if (currentPath === '/admin/dashboard') {
      if (role !== 'admin') {
        return (
          <Forbidden403View
            attemptedPath="/admin/dashboard"
            onRedirectToTechnician={() => navigate('/technician/dashboard')}
          />
        );
      }
      return (
        <AdminDashboardView
          onOpenJob={handleOpenJob}
          onNewJob={() => setNewJobModalOpen(true)}
        />
      );
    }

    if (currentPath === '/technician/dashboard') {
      return <TechnicianDashboardView onOpenJob={handleOpenJob} />;
    }

    // 2. Active Tab Routing
    switch (activeTab) {
      case 'dashboard':
        if (role === 'admin') {
          return (
            <AdminDashboardView
              onOpenJob={handleOpenJob}
              onNewJob={() => setNewJobModalOpen(true)}
            />
          );
        }
        return <TechnicianDashboardView onOpenJob={handleOpenJob} />;

      case 'service':
        if (role === 'technician') {
          return <TechnicianDeskView onOpenJob={handleOpenJob} />;
        }
        return (
          <ServiceView
            onOpenJob={handleOpenJob}
            onNewJob={() => setNewJobModalOpen(true)}
            onPrintReceipt={handlePrintReceipt}
          />
        );

      case 'records':
        return <RepairRecordsView onOpenJob={handleOpenJob} />;

      case 'finance':
        if (role !== 'admin') {
          return <TechnicianDeskView onOpenJob={handleOpenJob} />;
        }
        return <FinanceView />;

      case 'customers':
        return <CustomersView onOpenJob={handleOpenJob} />;

      case 'devices':
        return <DevicesView />;

      case 'users': return <UserAccessView />;
      case 'cashiers': return role === 'admin' ? <CashierAccountsView /> : <div>Administrator access required.</div>;
      case 'technicians':
        if (role !== 'admin') {
          return <TechnicianDeskView onOpenJob={handleOpenJob} />;
        }
        return <TechniciansView />;

      case 'reports':
        if (role !== 'admin') {
          return <TechnicianDeskView onOpenJob={handleOpenJob} />;
        }
        return <ReportsView />;

      case 'settings':
        if (role !== 'admin') {
          return <TechnicianDeskView onOpenJob={handleOpenJob} />;
        }
        return <SettingsView />;

      case 'about':
        return <AboutView />;

      case 'user-guide':
      case 'guide':
      case 'help':
        return <UserGuideView />;

      default:
        if (role === 'admin') {
          return (
            <AdminDashboardView
              onOpenJob={handleOpenJob}
              onNewJob={() => setNewJobModalOpen(true)}
            />
          );
        }
        return <TechnicianDashboardView onOpenJob={handleOpenJob} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)] transition-colors duration-150">
      {/* Left Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewJobModal={() => setNewJobModalOpen(true)}
          onOpenNotificationJob={handleOpenJob}
        />

        {/* View Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Suspense fallback={<div role="status" className="p-8 text-sm text-[var(--text-muted)]">Loading page…</div>}>{renderActiveView()}</Suspense>
        </main>
      </div>

      {/* Modals */}
      <Suspense fallback={<div role="status" className="fixed bottom-6 right-6 z-50 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">Loading…</div>}>
      {selectedJob && role === 'cashier' && <CashierJobModal job={jobs.find(j => j.id === selectedJob.id) || selectedJob} onClose={() => setSelectedJob(null)} onPrint={job => { setSelectedJob(null); handlePrintReceipt(job); }} />}
      {selectedJob && role !== 'cashier' && (
        <JobDetailModal
          job={jobs.find(job => job.id === selectedJob.id) || selectedJob}
          onClose={() => setSelectedJob(null)}
          onPrint={(jobToPrint) => {
            setSelectedJob(null);
            setPrintJob(jobToPrint);
          }}
        />
      )}

      {newJobModalOpen && (
        <NewTicketModal
          onClose={() => setNewJobModalOpen(false)}
          onCreated={handleCreatedJob}
        />
      )}

      {printJob && (
        <PrintTicketModal
          job={jobs.find(job => job.id === printJob.id) || printJob}
          onClose={() => setPrintJob(null)}
        />
      )}
      </Suspense>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { currentUser } = useApp();

  useCloseConfirmation(Boolean(currentUser));

  if (!currentUser) {
    return <LoginView />;
  }

  return <AuthenticatedLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
