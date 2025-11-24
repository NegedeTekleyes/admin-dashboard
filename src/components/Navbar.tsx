"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Navbar = () => {
  const router = useRouter();

  const [user, setUser] = useState({
    fullName: "",
    role: "",
    avatar: "/avatar.png",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);

      setUser({
        fullName: parsed.fullName || "Unknown User",
        role: parsed.role || "User",
        avatar: parsed.avatar || "/avatar.png",
      });
    }
  }, []);

  const handleProfileClick = () => {
    router.push("/profile");
  };

  return (
    <div className="fixed top-0 left-[250px] right-0 bg-white z-50 shadow-sm">
      <div className="flex items-center justify-between p-4">
        {/* SEARCH BAR */}
        <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
          <Image src="/search.png" alt="" width={14} height={14} />
          <input
            type="text"
            placeholder="Search..."
            className="w-[200px] p-2 bg-transparent outline-none"
          />
        </div>

        {/* ICONS AND USER */}
        <div className="flex items-center gap-6 justify-end w-full">
          <Link
            href="/notifications"
            className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer"
          >
            <Image src="/message.png" alt="Message icon" width={20} height={20} />
          </Link>

          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={handleProfileClick}
          >
            <div className="flex flex-col text-right">
              <span className="text-xs leading-3 font-medium">
                {user.fullName || "Loading..."}
              </span>
              <span className="text-[10px] text-gray-500">{user.role}</span>
            </div>

            <Image
              src={user.avatar}
              alt="User Avatar"
              width={36}
              height={36}
              className="rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
