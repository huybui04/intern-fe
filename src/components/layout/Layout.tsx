import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  user?: {
    username: string;
    role: string;
  } | null;
  setUser?: (user: any) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, setUser }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header user={user} setUser={setUser} />
      <main className="flex-grow-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
