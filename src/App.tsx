import { Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './components/LanguageContext';
import Home from './pages/Home';

export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="*" element={<Home />} />
      </Routes>
    </LanguageProvider>
  );
}
