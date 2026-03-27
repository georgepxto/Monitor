import { StatusDashboard } from './components/StatusDashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header/Nav */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">Monitor<span className="text-green-500">Hub</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <StatusDashboard />
      </main>
    </div>
  );
}

export default App;
