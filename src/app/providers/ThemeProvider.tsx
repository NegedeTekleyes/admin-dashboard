"use client"

import { createContext, useContext, useEffect, useState } from "react"

export default function ThemeProvider ({children}:{children: React.ReactNode}){
    const [theme, setTeme] = useState<'light' | 'dark'>('light')

    useEffect(()=> {
        const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
        if(saved){
            setTeme(saved)
            document.documentElement.classList.toggle('dark', saved === 'dark')
        }
    }, [])

    const toggleTheme = () => {
        const next = theme === 'light'? 'dark' : 'light'
        setTeme(next)
        localStorage.setItem('theme', next)
        document.documentElement.classList.toggle('dark', next === 'dark')
    }
    return(
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
    )
}

// simple context
const ThemeContext = createContext<{ theme: 'light' | 'dark'; toggleTheme: () => void }>({
  theme: 'light',
  toggleTheme: () => {},
});
export const useTheme = () => useContext(ThemeContext)