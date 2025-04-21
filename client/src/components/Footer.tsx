import { Users } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <p className="text-gray-600">EventStaff &copy; {new Date().getFullYear()}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-4">
              <li><a href="#" className="text-gray-600 hover:text-primary text-sm">Ajuda</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary text-sm">Privacidade</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary text-sm">Termos</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
