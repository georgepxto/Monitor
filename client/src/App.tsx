import { StatusDashboard } from './components/StatusDashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header/Nav */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
                <img
                  src="/favicon.svg"
                  alt="Monitor Hub"
                  className="w-8 h-8 rounded-lg object-contain"
                />
              <span className="font-bold text-lg sm:text-xl tracking-tight">Monitor<span className="text-green-500">Hub</span></span>
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
