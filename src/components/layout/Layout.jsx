import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <>
      <Navbar />

      <main className="page-container">
        {children}
      </main>

      <Footer />
    </>
  );
}