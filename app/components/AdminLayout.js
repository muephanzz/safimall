const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <main>{children}</main>
    </div>
  );
};

export default AdminLayout;
