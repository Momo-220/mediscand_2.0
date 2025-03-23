import { ThemeProvider } from '../components/ThemeProvider';
import MediScan from '../components/MediScan';

export default function Home() {
  return (
    <ThemeProvider>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-950 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <MediScan />
          
          <footer className="mt-16 text-center text-sm text-gray-400 opacity-70">
            <p>© {new Date().getFullYear()} MediScan. Tous droits réservés.</p>
          </footer>
        </div>
      </main>
    </ThemeProvider>
  );
}
