import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import PortalCards from "../components/PortalCards";
import Features from "../components/Features";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <PortalCards />
      <Features />
      <Footer />
    </>
  );
}

export default Home;