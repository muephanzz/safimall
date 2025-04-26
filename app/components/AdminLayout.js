const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen p-0 sm:p-0 lg:p-8 bg-gray-100 w-full sm:w-full lg:w-3/4 overflow-x-hidden">
      <main>{children}</main>
    </div>
  );
};

export default AdminLayout;
