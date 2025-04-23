import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  // Hide navbar if the current route is "/practice"
  if (location.pathname === "/practice") {
    return null;
  }

  return (
    <nav className="bg-[#2e1050] p-4 shadow-md ">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">Piano Bestie</h1>
        <div className="space-x-4">
          <Link to="/" className="text-white hover:text-gray-200">Home</Link>
          <Link to="/signup" className="text-white hover:text-gray-200">Sign Up</Link>
          <Link to="/dashboard" className="text-white hover:text-gray-200">Dashborad</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
