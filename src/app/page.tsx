import { ThemeProvider } from '../components/ThemeProvider';
import MediScan from '../components/MediScan';

export default function Home() {
  return (
    <ThemeProvider>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-950 py-3 sm:py-6">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <MediScan />
          
          <footer className="mt-8 sm:mt-12 lg:mt-16 text-center text-xs sm:text-sm text-gray-400 opacity-70 px-4">
            <p>© {new Date().getFullYear()} MediScan. Tous droits réservés.</p>
          </footer>
        </div>
      </main>
    </ThemeProvider>
  );
}
