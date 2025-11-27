import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { LogOut, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Booking {
  id: string;
  day: string;
  time: string;
  period: string;
  session_type: string;
  professional: string;
  user_name: string;
  user_email: string;
  user_phone: string;
}

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!roleLoading && role !== "professional") {
      navigate("/");
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("day", { ascending: true })
        .order("time", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const filteredBookings = bookings.filter((booking) => {
    try {
      const bookingDate = parseISO(booking.day);
      return isSameDay(bookingDate, selectedDate);
    } catch {
      return false;
    }
  });

  const bookingDates = bookings.map((b) => {
    try {
      return parseISO(b.day);
    } catch {
      return null;
    }
  }).filter(Boolean) as Date[];

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Painel Profissional
            </h1>
            <p className="text-muted-foreground mt-1">
              Bem-vinda! Aqui estão seus agendamentos
            </p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Calendário
            </h2>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              modifiers={{
                booked: bookingDates,
              }}
              modifiersStyles={{
                booked: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--primary) / 0.2)",
                  color: "hsl(var(--primary))",
                },
              }}
              className="rounded-md border"
            />
          </Card>

          {/* Appointments List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Agendamentos - {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </h2>
            
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum agendamento para este dia</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="p-4 border-l-4 border-l-primary">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{booking.user_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {booking.time} • {booking.period}
                          </p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {booking.session_type}
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t border-border/50 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Email:</span> {booking.user_email}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Telefone:</span> {booking.user_phone}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Profissional:</span> {booking.professional}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
