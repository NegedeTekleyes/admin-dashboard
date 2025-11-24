"use client";

import { handleLogout } from "@/utils/logout";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MAIN",
    items: [
      { icon: "/home.png", label: "Home", href: "/admin", visible: ["admin"] },
      { icon: "/lesson.svg", label: " Complaints", href: "/complaints", visible: ["admin"] },
      { icon: "/analytics.svg", label: "Analytics", href: "/analytics", visible: ["admin"] },
      { icon: "/report.svg", label: "Reports", href: "/reports", visible: ["admin"] },
      { icon: "/parent.png", label: "Technicians", href: "/technicians", visible: ["admin"] },
      { icon: "/bell.png", label: "Notifications", href: "/notifications", visible: ["admin"] },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { icon: "/profile.png", label: "Profile", href: "/profile", visible: ["admin"] },
      { icon: "/setting.png", label: "Settings", href: "/settings", visible: ["admin"] },
      {
        icon: "/logout.png",
        label: "Logout",
        action: handleLogout, 
        visible: ["admin"],
      },
    ],
  },
];

const Menu = () => {
  return (
    <div className="mt-4 text-sm">
      {menuItems.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <span className="hidden lg:block text-gray-500 font-light my-4">
            {section.title}
          </span>
          {section.items.map((item) =>
            item.action ? (
              // Button for logout or any action-based item
              <button
                key={item.label}
                onClick={item.action}
                className="flex items-center justify-center lg:justify-start gap-4 text-gray-600 py-2 md:px-2 rounded-md hover:bg-slate-400"
              >
                <Image src={item.icon} alt={item.label} width={20} height={20} />
                <span className="hidden lg:block">{item.label}</span>
              </button>
            ) : (
              // Normal link navigation
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-center lg:justify-start gap-4 text-gray-600 py-2 md:px-2 rounded-md hover:bg-slate-400"
              >
                <Image src={item.icon} alt={item.label} width={20} height={20} />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default Menu;
