import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import MaternalPrediction from "./pages/MaternalPrediction";
import FetalPrediction from "./pages/FetalPrediction";
import Payment from "./pages/Payment";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import UltrasoundPrediction from "./pages/UltrasoundPrediction";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout>
         <Routes>
  <Route path="/" element={<Index />} />
  <Route path="/maternal" element={<MaternalPrediction />} />
  <Route path="/fetal" element={<FetalPrediction />} />
  <Route path="/ultrasound" element={<UltrasoundPrediction />} />
  <Route path="/payment" element={<Payment />} />
  <Route path="/about" element={<About />} />
  <Route path="*" element={<NotFound />} />
</Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
