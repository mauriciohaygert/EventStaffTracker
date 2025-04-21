import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { QRScanModal } from "./modals/QRScanModal";
import { EmployeeModal } from "./modals/EmployeeModal";
import { ActionModal } from "./modals/ActionModal";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
      
      {/* Modals - these will be hidden by default and shown via context */}
      <QRScanModal />
      <EmployeeModal />
      <ActionModal />
    </div>
  );
};

export default Layout;
