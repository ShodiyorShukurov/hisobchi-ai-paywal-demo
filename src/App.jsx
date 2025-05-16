import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import CardForm from "./components/CardData";
import SMSVerification from "./components/SmsVertification";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:id" element={<CardForm />} />
        <Route path="/sms-verification" element={<SMSVerification />} />
      </Routes>
    </Router>
  );
}

export default App;
