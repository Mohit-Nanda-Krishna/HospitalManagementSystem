import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import PortalCards from "../components/PortalCards";
import Features from "../components/Features";
import Footer from "../components/Footer";
import "../styles/home.css";

function Home() {
  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      <PortalCards />
      <Features />
      <Footer />
    </div>
  );
}

export default Home;
