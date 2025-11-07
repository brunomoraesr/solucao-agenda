import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Users } from "lucide-react";
import { toast } from "sonner";

type BookingData = {
  id: string;
  day: string;
  period: string;
  time: string;
  session_type: string;
  professional: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  created_at: string;
};

const sessionTypeLabels: Record<string, string> = {
  "escalda-pes": "Escalda-Pés",
  pilates: "Pilates",
  massagem: "Massagem",
  acupuntura: "Acupuntura",
};

export const BookingsList = () => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
      setLoading(false);
      return;
    }

    setBookings(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">
          Nenhum agendamento encontrado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="p-6 rounded-xl border-2 border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="w-5 h-5 text-primary" />
                {booking.user_name}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {booking.day} • {booking.period === "morning" ? "Manhã" : "Tarde"}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {booking.time}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                  {sessionTypeLabels[booking.session_type] || booking.session_type}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium">Profissional: {booking.professional}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
