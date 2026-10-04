import { Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import {
  Dashboard,
  Evaluations,
  EvaluationDetail,
  Experiments,
  Datasets,
  Architecture,
  Compare,
} from '@/pages';

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <main className="pt-4 pb-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/evaluations" element={<Evaluations />} />
          <Route path="/evaluations/new" element={<Evaluations />} />
          <Route path="/evaluations/:id" element={<EvaluationDetail />} />
          <Route path="/evaluations/compare/:runAId/:runBId" element={<Compare />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route path="/architecture" element={<Architecture />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;