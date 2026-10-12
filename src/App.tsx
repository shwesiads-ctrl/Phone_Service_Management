import { UserAccessView } from './views/UserAccessView';
import { CashierDashboardView } from './views/CashierDashboardView';
import { CashierAccountsView } from './views/CashierAccountsView';
import { CashierJobModal } from './modals/CashierJobModal';
import { useCloseConfirmation } from './hooks/useCloseConfirmation';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AdminDashboardView } from './views/AdminDashboardView';
import { TechnicianDashboardView } from './views/TechnicianDashboardView';
import { Forbidden403View } from './views/Forbidden403View';
import { ServiceView } from './views/ServiceView';
import { TechnicianDeskView } from './views/TechnicianDeskView';
import { CustomersView } from './views/CustomersView';
import { DevicesView } from './views/DevicesView';
import { TechniciansView } from './views/TechniciansView';
import { RepairRecordsView } from './views/RepairRecordsView';
import { FinanceView } from './views/FinanceView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';
import { UserGuideView } from './views/UserGuideView';
import { LoginView } from './components/LoginView';
import { JobDetailModal } from './modals/JobDetailModal';
import { NewTicketModal } from './modals/NewTicketModal';
import { PrintTicketModal } from './modals/PrintTicketModal';
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
      if (!['dashboard','service'].includes(activeTab)) return <div className="p-6">Cashier access: intake, payments and receipts.</div>;
      return activeTab === 'dashboard' ? <CashierDashboardView onNewJob={() => setNewJobModalOpen(true)} onOpenJob={handleOpenJob} onPrintReceipt={handlePrintReceipt} /> : <ServiceView onOpenJob={handleOpenJob} onNewJob={() => setNewJobModalOpen(true)} onPrintReceipt={handlePrintReceipt} />;
    }
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
          {renderActiveView()}
        </main>
      </div>

      {/* Modals */}
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
