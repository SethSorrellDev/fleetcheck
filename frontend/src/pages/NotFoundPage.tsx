import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper font-sans text-graphite">
      <p className="font-mono text-sm text-steel">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold uppercase">Page not found</h1>
      <Link to="/" className="mt-4 text-sm text-safety underline">
        Back to dashboard
      </Link>
    </div>
  )
}
