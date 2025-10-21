import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MAIN",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/admin",
        visible: ["admin"], // Admin overview with summary stats
      },
      {
        icon: "/lesson.svg",
        label: "Manage Complaints",
        href: "/complaints",
        visible: ["admin"], // List, filter, assign, and review complaints
      },
      {
        icon: "/analytics.svg",
        label: "Analytics",
        href: "/analytics",
        visible: ["admin"], // View charts (categories, resolution times)
      },
      {
        icon: "/report.svg",
        label: "Reports",
        href: "/reports",
        visible: ["admin"], // Generate and download CSV reports
      },
      {
        icon: "/parent.png",
        label: "Manage Users",
        href: "/technicians",
        visible: ["admin", "users", "technicians"], // List and manage residents/technicians
      },
      {
        icon: "/bell.png",
        label: "Notifications",
        href: "/notifications",
        visible: ["admin"], // Configure SMS/push notifications
      },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin"], // View/edit admin profile
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin"], // Admin-specific settings
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin"], // Logout action
      },
    ],
  },
];
const Menu = () => {
  return (
    <div className="mt-4 text-sm">
      {menuItems.map(i => (
        <div className="flex flex-col gap-2 " key={i.title}>
          <span className="hidden lg:block text-gray-500 font-light my-4">{i.title}</span>
          {i.items.map(item => (
            <Link
              href={item.href}
              key={item.label}
              className="flex items-center justify-center lg:justify-start gap-4 text-gray-600 py-2 md:px-2 rounded-md hover:bg-slate-400">
              <Image src={item.icon} alt="" width={20} height={20} />
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          ))}
        </div>
      ))}

    </div>
  )
}
export default Menu