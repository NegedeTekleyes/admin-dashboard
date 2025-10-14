"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaShieldAlt } from "react-icons/fa"

const AdminAuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    inviteCode: ""
  })

  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>{
    const {name, value} = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if(errors[name]){
      setErrors(prev=>{
        const newErrors ={ ...prev}
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

      if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
       if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (!isLogin && !formData.inviteCode) {
      newErrors.inviteCode = "Invitation code is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  
  }
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      // await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isLogin) {
        const response = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          }),
        })

        if(!response.ok){
          const errorData = await response.json()
          throw new Error(errorData.message || 'Login Failed')
        }

        const data = await response.json()

        // store authentication data
        localStorage.setItem('authToken', data.access_token)
        localStorage.setItem('userData', JSON.stringify(data.user))

        // check if user is admin
        if(data.user.role !=='ADMIN'){
          throw new Error('Access denied. Admin privileges required.')
        }

        console.log("Login successful!", data.user)
        router.push('/admin')
      }else{
        // Registration logic (you can implement this later)
        console.log("Registration attempt:", formData)
        alert("Admin registration requires manual setup. Please contact system administrator.")
      }
    } catch(error: any){
       console.error("Auth error:", error)
      setErrors({ submit: error.message || 'Authentication failed' })
    } finally{
      setIsSubmitting(false)
    }
        // console.log("Login attempt:", { email: formData.email });
        // In real app: API call to authenticate admin
        // for demo purpose we'll accept any email/password combination
//         const isAuthenticated = true

//         if(isAuthenticated) {
//           // store authentication data (in real app, you'd get this fromyour api)

//           localStorage.setItem('authToken', 'demo-token-123')
//           localStorage.setItem('userData', JSON.stringify({
//             name: 'Admin User',
//             email: formData.email,
//             role: 'admin'

//           }))
//           // alert("Login successful! Redirecting to dashboard...");
//         router.push('/admin')
//         }
//       } else {
//         // registration logic 
//         console.log("Registration attempt:", formData);

//         // for demo accept any invite code that's not empty
//         if(formData.inviteCode.trim()) {
//           alert("Account created successfully! You can now login.");
//           setIsLogin(true); // Switch to login after successful registration
// // clear the form
//           setFormData({
//             email: '',
//             password: '',
//             inviteCode: ""
//           })
//         } else {
//           alert("Registration failed.Place check your invation code.")
//         }
//       }
    // } catch (error) {
    //   console.error("Auth error:", error);
    //   alert(isLogin ? "Login failed. Please check your credentials." : "Registration failed. Please check your invitation code.");
    // } finally {
    //   setIsSubmitting(false);
    // }
  };


   return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-NegeSky py-4 px-6">
          <h1 className="text-2xl font-bold text-white text-center">
            {isLogin ? "Admin Login" : "Admin Registration"}
          </h1>
          <p className="text-blue-100 text-center mt-1">
            Water Complaint Management System
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="admin@waterworks.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-10 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>
          
          {/* Invite Code Field (for registration only) */}
          {!isLogin && (
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
                Invitation Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaShieldAlt className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="inviteCode"
                  name="inviteCode"
                  value={formData.inviteCode}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.inviteCode ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your invitation code"
                />
              </div>
              {errors.inviteCode && <p className="mt-1 text-sm text-red-600">{errors.inviteCode}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Contact system administrator to get an invitation code
              </p>
            </div>
          )}
          
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-NegeSky hover:bg-NegeSkyLight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? "Signing in..." : "Creating Account..."}
                </>
              ) : isLogin ? "Sign In" : "Create Account"}
              
            </button>
          </div>
          
          {/* Switch between Login and Register */}
          <div className="text-center text-sm text-gray-600">
            {isLogin ? (
              <>
                Need admin access?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Request access
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in here
                </button>
              </>
            )}
          </div>
          
          {/* Security Notice */}
          <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaShieldAlt className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Admin Access Only</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This portal is restricted to authorized personnel only. Unauthorized access attempts may be logged and investigated.</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
export default AdminAuthPage