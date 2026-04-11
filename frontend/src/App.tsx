import { Routes, Route ,Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { axiosInstance } from "./lib/axios"

import { useAuthStore } from "./store/useAuthStore"
import { useChatStore } from "./store/useChatStore"

import SignupPage from "./pages/signup"
import LoginPage from "./pages/login"
import LandingPage from "./pages/landingPage"
import HomePage from "./pages/homePage"
import AccountPage from "./pages/userPage"
import CreateAiPage from "./pages/createAiPage"
import MyAiPage from "./pages/myAiModels"
import UpdateAiPage from "./pages/updateAiPage"
import ChatPage from "./pages/chatPage"
import PlansPage from "./pages/plansPage"
import CreatePlanPage from "./pages/createPlanPage"
import PaymentPage from "./pages/payPage"

import MainLayout from "./layout/Mainlayout"


import { Toaster } from "react-hot-toast"
import { Loader } from "lucide-react"
import axios from "axios"


function App() {
  const { isCheckingAuth, user , checkAuth } = useAuthStore()
  const [isBackendReady, setIsBackendReady] = useState(false);
  const { subscribeToSocketForNotification } = useChatStore()

  const checkBackend = async () => {
    try {
      await axiosInstance.get("/health"); 
      await axios.get(import.meta.env.VITE_HF_URL)
      setIsBackendReady(true);
    } catch (err) {
      setTimeout(checkBackend, 2000);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);


  useEffect(() => {
    const init = async () =>{
      if(isBackendReady){
        await checkAuth()
        subscribeToSocketForNotification()
      }   
    }
    
    init()
   
  }, [isBackendReady])




  if (!isBackendReady) {
    return <LandingPage />; 
  }
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
                <Route path="/subscription-plans" element={<PlansPage />} />
                <Route path="/create-plans" element={<CreatePlanPage />} />
                <Route path="/pay/:id" element={<PaymentPage />} />
              </Route>
              <Route path="/signup" element={user? <Navigate to="/"/>:<SignupPage />} />
              <Route path="/login" element={user? <Navigate to="/"/>: <LoginPage />} />
          </Routes>
    </div>
    
  )
}

export default App