import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">⚽</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Mercado no encontrado</h2>
      <p className="text-gray-500 text-sm mb-6">
        Este mercado no existe o ya no está disponible.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Ver todos los mercados
      </Link>
    </div>
  );
}
