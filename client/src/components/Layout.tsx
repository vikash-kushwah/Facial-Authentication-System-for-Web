import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { User } from '@/App';

type LayoutProps = {
  children: ReactNode;
  user: User | null;
  onLogout: () => void;
};

const Layout = ({ children, user, onLogout }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
