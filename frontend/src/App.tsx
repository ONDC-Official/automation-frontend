import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/index";
import Transaction from "./pages/Transaction/index";
import Flows from "./pages/Flows";
import VerifyPayload from "./pages/VerifyPayload";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/flows" element={<Flows />} />
      <Route path="/transaction" element={<Transaction />} />
      <Route path="/verify" element={<VerifyPayload />} />
    </Routes>
  );
};

export default App;
