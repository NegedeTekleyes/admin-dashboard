"use client"

import { stringify } from "querystring"
import {createContext, ReactNode, useContext, useEffect, useState } from "react"

interface User {
    id: string,
    name: string,
    email: string,
    role: string,
    avatar?: string,
}

interface AuthContextType {
    user: User | null
    login: (email: string, password:string) => Promise<boolean>
    logout: () => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType |undefined>(undefined)

export const AuthProvider: React.FC<{children: ReactNode}> = ({children}) => {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(()=>{
        // check if the user is logged in on initial load
        const checkAuthStatus = async () => {
            try {
                const token = localStorage.getItem('authToken')
                if(token) {
                    // verify token with backend (simpliofied)
                    const userData = localStorage.getItem('userData')
                    if(userData) {
                        setUser(JSON.parse(userData))
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error)
                localStorage.removeItem('authToken')
                localStorage.removeItem('userData')
            }finally{
                setIsLoading(false)
            }
        }
        checkAuthStatus()
    }, [])

    const login = async (email: string, password: string): Promise<boolean> =>{
        try {
            setIsLoading(true)
            // simulate api call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // in real app this would calll your authentication api
            if(email==='admin@waterworks.com' && password === 'password123'){
                const userData = {
                    id: '1',
                    name: 'Admin user',
                    email: email,
                    role: 'admin',
                    avatar: '/api/placeholder'
                }

                setUser(userData)
                localStorage.setItem('authToken', 'simulated-jwt-token')
                localStorage.setItem('userData', stringify(userData))
                return true
            }
            return false
        } catch (error) {
           console.error('Login failed:', error) 
           return false
        } finally{
            setIsLoading(false)
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('authToken')
        localStorage.removeItem('userData')
        // redirect to login page
        window.location.href='/admin'
    }

    return(
        <AuthContext.Provider value ={{user, login, logout, isLoading}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () =>{
    const context = useContext(AuthContext)
    if(context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')

    }
    return context
}