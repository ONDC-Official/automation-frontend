import React from "react";
import { MdOutlineEmail } from "react-icons/md";
import { FaGithub } from "react-icons/fa6";
import { SiSharex } from "react-icons/si";

const resourceList = [
  {
    title: "Contact Us",
    icon: <MdOutlineEmail />,
    link: "mailto:PW-support@ondc.org",
  },
  {
    title: "Github",
    icon: <FaGithub />,
    link: "https://github.com/ONDC-Official/automation-framework",
  },
  {
    title: "Contribute",
    icon: <SiSharex />,
    link: "https://github.com/ONDC-Official/automation-framework",
  },
];

const Footer: React.FC = () => {
  return (
    <footer className=" bg-sky-900 text-white py-4">
      <section id="contact" className="py-12  ">
        <div className="container mx-auto text-center px-4">
          <h3 className="text-3xl font-bold mb-6">Resources</h3>
          <div className="flex gap-5 justify-center">
            {resourceList.map((item, _index) => {
              return (
                <div
                  className="flex justify-center gap-2 items-center cursor-pointer"
                  onClick={() => window.open(item.link, "_blank")}
                >
                  <div>{item.icon}</div>
                  <p>{item.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <div className="container mx-auto text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} ONDC Integration testing. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
