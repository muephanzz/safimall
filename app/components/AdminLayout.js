import Link from "next/link";

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header / Navbar */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin" passHref
            className="text-2xl font-extrabold text-green-600 hover:text-green-700 transition-colors">
              Admin Panel
          </Link>
          {/* Optional: Add user info or nav links here */}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 min-h-[70vh]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
