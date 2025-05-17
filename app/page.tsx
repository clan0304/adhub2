import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to Our Platform
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Connect with businesses and creators to grow your online presence.
        </p>
        <div className="flex flex-col space-y-4">
          <Link
            href="/auth"
            className="w-full py-3 px-6 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-md transition duration-200"
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="w-full py-3 px-6 text-center bg-white hover:bg-gray-50 text-indigo-600 font-medium rounded-md shadow-md border border-gray-200 transition duration-200"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}
