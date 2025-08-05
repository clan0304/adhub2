import { SignIn } from '@clerk/nextjs';

export default function AuthPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Welcome to AdHub
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in or create an account to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignIn
            path="/auth"
            routing="path"
            signUpUrl="/auth"
            redirectUrl="/profile-setup"
            appearance={{
              elements: {
                formButtonPrimary:
                  'bg-indigo-600 hover:bg-indigo-700 text-sm normal-case',
                card: 'shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton:
                  'border border-gray-300 text-gray-700 hover:bg-gray-50',
                formFieldInput: 'rounded-md border-gray-300',
                footerActionLink: 'text-indigo-600 hover:text-indigo-500',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
