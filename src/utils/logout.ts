"use client"

export const handleLogout = () => {
    if (typeof window !== 'undefined'){
        localStorage.removeItem('admin_api_key')
        sessionStorage.clear()
        window.location.href = "/"
    }
}