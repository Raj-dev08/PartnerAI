import { Routes, Route ,Navigate } from "react-router-dom"
import { useEffect } from "react"

import { useAuthStore } from "./store/useAuthStore"

import SignupPage from "./pages/signup"
import LoginPage from "./pages/login"
import LandingPage from "./pages/landingPage"
import HomePage from "./pages/homePage"
import AccountPage from "./pages/userPage"
import CreateAiPage from "./pages/createAiPage"
import MyAiPage from "./pages/myAiModels"
import UpdateAiPage from "./pages/updateAiPage"
import ChatPage from "./pages/chatPage"

import MainLayout from "./layout/Mainlayout"


import { Toaster } from "react-hot-toast"
import { Loader } from "lucide-react"


function App() {
  const { isCheckingAuth, user , checkAuth } = useAuthStore()


  useEffect(() => {
    checkAuth()
  }, [])


  if (isCheckingAuth && !user)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  return (
    <div className="bg-linear-to-b from-base-300 to-primary/20 min-h-screen"> 
        <Toaster position="top-right" reverseOrder={false} />
          <Routes>
              <Route element={user ? <MainLayout /> : <Navigate to="/signup" />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/create" element={<CreateAiPage />} />
                <Route path="/my-ai" element={<MyAiPage />} />
                <Route path="/ai-model/update/:id" element={<UpdateAiPage />} />
                <Route path="/chat/" element={<ChatPage />} />
              </Route>

              <Route path="/landingpage" element={<LandingPage/>} />
              <Route path="/signup" element={user? <Navigate to="/"/>:<SignupPage />} />
              <Route path="/login" element={user? <Navigate to="/"/>: <LoginPage />} />
          </Routes>
    </div>
    
  )
}

export default App