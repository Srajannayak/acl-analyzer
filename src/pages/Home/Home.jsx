import Navbar from "../../components/layout/Navbar";
import Hero from "../../components/home/Hero";
import FeatureCards from "../../components/home/FeatureCards";
import Statistics from "../../components/home/Statistics";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <FeatureCards />
      <Statistics />
    </>
  );
}

export default Home;