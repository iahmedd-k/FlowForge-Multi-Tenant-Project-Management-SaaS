import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useLocation } from "react-router-dom";

const GenericPage = () => {
  const location = useLocation();
  const path = location.pathname.replace('/', '').replace('-', ' ');
  const title = path.charAt(0).toUpperCase() + path.slice(1);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1 container max-w-3xl py-24">
         <h1 className="text-5xl font-display font-medium text-gray-900 mb-8 font-bold">{title}</h1>
         
         <div className="prose prose-lg max-w-none text-gray-600">
            <p className="lead text-xl mb-8 font-medium">This is a mock page generated for <strong>{title}</strong>.</p>
            
            <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.</p>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Section 1</h2>
            <p className="mb-4">Sed portitor lectus nibh. Cras ultricies ligula sed magna dictum porta. Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Nulla porttitor accumsan tincidunt.</p>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Section 2</h2>
            <p className="mb-4">Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Donec rutrum congue leo eget malesuada.</p>
         </div>
      </div>
      <Footer />
    </div>
  );
};

export default GenericPage;
