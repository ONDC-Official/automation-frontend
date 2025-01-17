// src/components/Footer.tsx
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className=" bg-sky-900 text-white py-4">
       {/* Call-to-Action Section */}
       <section id="contact" className="py-12  ">
            <div className="container mx-auto text-center px-4">
              <h3 className="text-3xl font-bold mb-6">Get Started with Automation</h3>
              <p className="text-lg mb-6">
                Ready to transform your workflow with Automation Tool? Let’s automate your processes today!
              </p>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-md hover:bg-gray-100">
                Contact Us
              </button>
            </div>
          </section>
      <div className="container mx-auto text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} ONDC Integration testing. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
