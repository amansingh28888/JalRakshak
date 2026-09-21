import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import MapView from './pages/MapView';
import AlertCenter from './pages/AlertCenter';
import CitizenAlert from './pages/CitizenAlert';
import DataManagement from './pages/DataManagement';
import Methodology from './pages/Methodology';
import Standards from './pages/Standards';
import About from './pages/About';
import SampleDetail from './pages/SampleDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/alerts" element={<AlertCenter />} />
          <Route path="/citizen" element={<CitizenAlert />} />
          <Route path="/data" element={<DataManagement />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/standards" element={<Standards />} />
          <Route path="/about" element={<About />} />
          <Route path="/sample/:id" element={<SampleDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
